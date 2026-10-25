"""ข้าวตัง 3D: a chubby mochi kitten the colour of toasted rice cracker.

Browned ear tips, tail tip and forehead marks (like a cracker's toasted edge)
and an indigo pencil tucked behind the right ear.

Run headless with Blender 5:
  blender -b --factory-startup -P tools/blender/khaotang.py -- <out_dir> <task> [...]
Tasks:
  preview         paper-backed 3/4 renders of every mood (for review)
  stills          transparent WebP per mood -> <out>/khaotang-<mood>.webp
  scenes          the decorated themes' poses -> <out>/khaotang-<scene>.webp
  glb             the animatable model -> <out>/khaotang.glb (compress with gltf-transform)

The GLB is a node tree the app animates (src/mascot/live.ts):
  Root > Body, Paw*, Foot*, Belly, Tail (pivot at its base) and Head (pivot at the neck)
  Head > face parts, Ear.L/R (pivots at the base), Eye.L/R (pivots at the eye centre)
Nodes with a `moods` extra are mood props: "a b" shows them only in those moods,
"-a -b" shows them in every other mood. Root's `poses` extra holds each mood's
head and ear angles as [pitch, yaw, roll] in degrees (yaw + turns the face to the
viewer's right, roll + leans the top of the head to the viewer's right).
"""
import bpy, bmesh, json, math, os, sys
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else '.')
TASKS = argv[1:] or ['preview']

MOODS = ['happy', 'worried', 'sleeping', 'reading', 'celebrate']
POSES = {
    'happy': {'head': [0, 0, 0], 'ears': 0},
    'worried': {'head': [4, 0, -6], 'ears': 16},
    'sleeping': {'head': [12, 0, 7], 'ears': 12},
    'reading': {'head': [9, 0, 0], 'ears': 0},
    'celebrate': {'head': [-6, 0, 0], 'ears': -6},
}


# ---------------------------------------------------------------- materials
def lin(hex_):
    h = hex_.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)


def material(name, hex_, rough=0.55, sss=0.0, emit=0.0, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = lin(hex_)
    b.inputs['Roughness'].default_value = rough
    if sss:
        b.inputs['Subsurface Weight'].default_value = sss
        b.inputs['Subsurface Radius'].default_value = (1.0, 0.45, 0.25)
        b.inputs['Subsurface Scale'].default_value = 0.06
    if emit:
        b.inputs['Emission Color'].default_value = lin(hex_)
        b.inputs['Emission Strength'].default_value = emit
    if coat:
        b.inputs['Coat Weight'].default_value = coat
        b.inputs['Coat Roughness'].default_value = 0.08
    return m


def make_materials():
    return dict(
        coat=material('coat', '#E0A24C', 0.6, sss=0.08),
        toast=material('toast', '#9A4F1E', 0.6, sss=0.05),   # browned cracker edge
        cream=material('cream', '#FBE7C6', 0.62, sss=0.1),
        pink=material('pink', '#F08F86', 0.5, sss=0.2),
        blush=material('blush', '#F7A79A', 0.7),
        eye=material('eye', '#21180F', 0.12, coat=1.0),
        shine=material('shine', '#FFFFFF', 0.3, emit=4.0),
        ink=material('ink', '#2A1F17', 0.4),
        mouth=material('mouth', '#7A2E22', 0.5),
        sky=material('sky', '#6FB6EA', 0.1, coat=1.0),
        pencil=material('pencil', '#2F6FA8', 0.4, coat=0.6),
        wood=material('wood', '#EDCB98', 0.7),
        lead=material('lead', '#2B2622', 0.35),
        ferrule=material('ferrule', '#C9C3B6', 0.25),
        eraser=material('eraser', '#F2A0A6', 0.75),
        paper=material('paper', '#FFFCF6', 0.8),
        waffle=material('waffle', '#D9A35B', 0.75),
        scoop=material('scoop', '#F4A6C0', 0.55, sss=0.2),
        yellow=material('yellow', '#FFB347', 0.35, coat=0.5),
        handle=material('handle', '#4A3626', 0.5),
    )


# ---------------------------------------------------------------- mesh helpers
col = None


def link(name, data, mat=None):
    o = bpy.data.objects.new(name, data)
    col.objects.link(o)
    if mat is not None:
        data.materials.append(mat)
    return o


def smooth(me):
    me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))


def empty(name, loc=(0, 0, 0)):
    o = bpy.data.objects.new(name, None)
    col.objects.link(o)
    o.location = loc
    return o


def sphere(name, loc, scale, mat, rot=None, seg=24):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=1)
    bm.to_mesh(me); bm.free(); smooth(me)
    o = link(name, me, mat)
    o.location = loc; o.scale = scale
    if rot is not None:
        o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = rot
    return o


def cone(name, r1, r2, depth, mat, segs=24):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=r1, radius2=r2, depth=depth)
    bm.to_mesh(me); bm.free()
    return link(name, me, mat)


def teardrop(name, r, h, mats, tip_from=None, taper=0.86, seg=28):
    """A sphere stretched to height h and tapered to a soft point; faces above tip_from (0..1) use mats[1]."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg * 2 // 3, radius=1)
    for v in bm.verts:
        t = (v.co.z + 1) / 2
        k = r * (1 - taper * t ** 1.15)
        v.co.x *= k; v.co.y *= k; v.co.z *= h / 2
    bm.to_mesh(me); bm.free(); smooth(me)
    o = link(name, me, mats[0])
    if tip_from is not None:
        me.materials.append(mats[1])
        for p in me.polygons:
            if (p.center.z / (h / 2) + 1) / 2 > tip_from:
                p.material_index = 1
    return o


K = 0.573  # metaball ellipsoid half-extent per unit size at stiffness 2, threshold 0.6


def evaluated_mesh(o):
    dg = bpy.context.evaluated_depsgraph_get()
    return bpy.data.meshes.new_from_object(o.evaluated_get(dg))


def blob(name, parts, mat, faces=4000):
    """Fuse ellipsoids (centre, half-extents) into one soft clay mesh, decimated to about `faces`."""
    mb = bpy.data.metaballs.new(name + '_mb')
    mb.threshold = 0.6; mb.resolution = 0.02; mb.render_resolution = 0.02
    for co, half in parts:
        e = mb.elements.new(type='ELLIPSOID')
        e.co = co; e.radius = 1.0; e.stiffness = 2.0
        e.size_x, e.size_y, e.size_z = (h / K for h in half)
    tmp = bpy.data.objects.new(name + '_tmp', mb); col.objects.link(tmp)
    me = evaluated_mesh(tmp)
    col.objects.unlink(tmp); bpy.data.objects.remove(tmp)
    o = link(name, me, mat)
    if len(me.polygons) > faces:
        d = o.modifiers.new('dec', 'DECIMATE'); d.ratio = faces / len(me.polygons)
        apply_modifiers(o)
    smooth(o.data)
    return o


def apply_modifiers(o):
    if o.modifiers or o.type == 'CURVE':
        me = evaluated_mesh(o)
        mats = list(o.data.materials)
        if o.type == 'CURVE':
            name = o.name
            o.name = name + '_curve'
            new = link(name, me)
            if not me.materials:
                for m in mats:
                    me.materials.append(m)
            new.matrix_world = o.matrix_world
            new.parent = o.parent
            for k in o.keys():
                new[k] = o[k]
            col.objects.unlink(o); bpy.data.objects.remove(o)
            return new
        o.modifiers.clear()
        o.data = me
        if not me.materials:
            for m in mats:
                me.materials.append(m)
    return o


def tube(name, pts, radius, mat, radii=None, res=3, cyclic=False):
    """A bevelled curve through pts, baked to a mesh."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'; cu.bevel_depth = radius; cu.bevel_resolution = res
    cu.use_fill_caps = not cyclic; cu.resolution_u = 8
    sp = cu.splines.new('BEZIER')
    sp.bezier_points.add(len(pts) - 1)
    sp.use_cyclic_u = cyclic
    for i, p in enumerate(pts):
        bp = sp.bezier_points[i]
        bp.co = p; bp.handle_left_type = bp.handle_right_type = 'AUTO'
        bp.radius = radii[i] if radii else 1.0
    o = link(name, cu, mat)
    o = apply_modifiers(o)
    smooth(o.data)
    return o


def facing(nor):
    return nor.to_track_quat('Z', 'Y')


def surf(obj, x, z):
    """First hit on obj seen from the front (−Y) at (x, z), in world space."""
    bpy.context.view_layer.update()
    inv = obj.matrix_world.inverted()
    ok, loc, nor, _ = obj.ray_cast(inv @ Vector((x, -5, z)), (inv.to_3x3() @ Vector((0, 1, 0))).normalized())
    assert ok, (obj.name, x, z)
    return obj.matrix_world @ loc, (obj.matrix_world.to_3x3() @ nor).normalized()


def hit(x, z):
    """First hit on anything seen from the front."""
    bpy.context.view_layer.update()
    ok, loc, nor, *_ = bpy.context.scene.ray_cast(bpy.context.evaluated_depsgraph_get(), Vector((x, -5, z)), Vector((0, 1, 0)))
    assert ok, (x, z)
    return loc, nor


def adopt(o, parent, moods=None):
    """Bake o's world transform into its mesh, then hang it under parent with no rotation or scale."""
    o = apply_modifiers(o)
    mw = o.matrix_basis.copy()  # nothing is parented yet; matrix_world may be stale
    if o.type == 'MESH':
        o.data.transform(Matrix.Translation(-parent.matrix_world.translation) @ mw)
        if mw.determinant() < 0:
            o.data.flip_normals()
    o.parent = parent
    o.matrix_parent_inverse = Matrix.Identity(4)
    o.rotation_mode = 'XYZ'
    o.location = (0, 0, 0); o.rotation_euler = (0, 0, 0); o.scale = (1, 1, 1)
    if moods:
        o['moods'] = moods
    return o


def pivot(name, loc, parent, moods=None):
    p = empty(name, loc)
    if parent is not None:
        bpy.context.view_layer.update()
        p.parent = parent
        p.matrix_parent_inverse = Matrix.Identity(4)
        p.location = Vector(loc) - parent.matrix_world.translation
    if moods:
        p['moods'] = moods
    return p


# ---------------------------------------------------------------- the cat
def build(M, pose='sit', props=()):
    """Builds ข้าวตัง at rest. Returns the named pivots."""
    lie = pose == 'lie'
    root = empty('Root')
    root['poses'] = json.dumps(POSES)

    # --- body
    if lie:
        body = blob('Body', [
            (Vector((0, 0.42, 0.34)), (0.50, 0.92, 0.36)),     # long loaf
            (Vector((0.30, 0.95, 0.30)), (0.26, 0.38, 0.28)),
            (Vector((-0.30, 0.95, 0.30)), (0.26, 0.38, 0.28)),
            (Vector((0, -0.08, 0.66)), (0.40, 0.36, 0.30)),    # chest under the head
        ], M['coat'])
        neck = Vector((0, -0.25, 0.75))
        head_c = Vector((0, -0.42, 1.05))
    else:
        body = blob('Body', [
            (Vector((0, 0.06, 0.48)), (0.50, 0.48, 0.48)),
            (Vector((0.34, 0.10, 0.27)), (0.27, 0.36, 0.26)),
            (Vector((-0.34, 0.10, 0.27)), (0.27, 0.36, 0.26)),
            (Vector((0, 0.02, 0.86)), (0.40, 0.36, 0.24)),     # neck, hidden under the cheeks
        ], M['coat'])
        neck = Vector((0, 0, 0.95))
        head_c = Vector((0, 0, 1.40))
    body = adopt(body, root)

    if not lie:
        loc, nor = surf(body, 0, 0.50)
        adopt(sphere('Belly', loc - nor * 0.12, (0.26, 0.32, 0.15), M['cream'], facing(nor)), root)
    for s, side in ((1, 'L'), (-1, 'R')):
        if lie:
            adopt(sphere(f'Paw.{side}', (0.20 * s, -0.54, 0.10), (0.14, 0.20, 0.10), M['cream']), root)
            adopt(sphere(f'Foot.{side}', (0.42 * s, 1.15, 0.09), (0.14, 0.22, 0.09), M['cream']), root)
        else:
            boots = 'boots' in props
            paw_mat, foot_mat = (M['yellow'], M['yellow']) if boots else (M['cream'], M['cream'])
            adopt(sphere(f'Paw.{side}', (0.19 * s, -0.42, 0.10), (0.14, 0.18, 0.10), paw_mat), root, '-reading')
            adopt(sphere(f'Foot.{side}', (0.45 * s, -0.12, 0.085), (0.14, 0.20, 0.085), foot_mat), root)
            if boots:  # rain boots: a shaft above each front paw
                b = cone(f'Boot.{side}', 0.12, 0.12, 0.22, M['yellow'], segs=24)
                b.location = (0.19 * s, -0.38, 0.22)
                adopt(b, root)

    # --- tail, pivot at its base
    if lie:
        pts = [(0.05, 1.25, 0.34), (0.20, 1.55, 0.40), (0.25, 1.62, 0.80), (0.12, 1.48, 1.12)]
        tip = [(0.12, 1.48, 1.12), (0.02, 1.38, 1.24), (-0.10, 1.34, 1.24)]
    else:
        pts = [(0.25, 0.48, 0.22), (0.72, 0.58, 0.24), (1.00, 0.42, 0.52), (1.04, 0.20, 0.86)]
        tip = [(1.04, 0.20, 0.86), (0.98, 0.08, 1.04), (0.88, 0.02, 1.10)]
    tail = pivot('Tail', pts[0], root)
    adopt(tube('TailCoat', [Vector(p) for p in pts], 0.105, M['coat'], [1.0, 1.0, 0.95, 0.9], res=4), tail)
    adopt(tube('TailToast', [Vector(p) for p in tip], 0.105, M['toast'], [0.9, 0.82, 0.70], res=4), tail)
    adopt(sphere('TailEnd', tip[-1], (0.105 * 0.7,) * 3, M['toast']), tail)

    # --- head, pivot at the neck
    head = pivot('Head', neck, root)
    skull = adopt(blob('Skull', [
        (head_c, (0.86, 0.68, 0.64)),
        (head_c + Vector((0.42, -0.28, -0.20)), (0.30, 0.26, 0.24)),   # cheek puffs
        (head_c + Vector((-0.42, -0.28, -0.20)), (0.30, 0.26, 0.24)),
    ], M['coat'], faces=6000), head)
    hz = head_c.z

    def at(x, dz):
        return surf(skull, x, hz + dz)

    for s, side in ((1, 'L'), (-1, 'R')):
        # open eyes: pivot at the centre so the app can blink them
        loc, nor = at(0.31 * s, -0.02)
        q = facing(nor)
        centre = loc - nor * 0.025
        eye = pivot(f'Eye.{side}', centre, head, '-sleeping -celebrate')
        adopt(sphere(f'EyeBall.{side}', centre, (0.115, 0.14, 0.06), M['eye'], q, seg=32), eye)
        up = q @ Vector((0, 1, 0)); right = q @ Vector((1, 0, 0))
        adopt(sphere(f'Shine.{side}', loc + nor * 0.03 + up * 0.05 - right * 0.035, (0.034,) * 3, M['shine'], seg=12), eye)
        adopt(sphere(f'Shine2.{side}', loc + nor * 0.025 - up * 0.045 + right * 0.04, (0.014,) * 3, M['shine'], seg=8), eye)

        # closed eyes ◡ (sleeping) and joyful eyes ∩ (celebrate)
        for name, lift, moods in (('Sleepy', (0.035, -0.03, 0.035), 'sleeping'), ('Joy', (-0.035, 0.035, -0.035), 'celebrate')):
            arc = []
            for dx, dz in zip((-0.10, 0.0, 0.10), lift):
                l, n = at(0.31 * s + dx, -0.02 + dz)
                arc.append(l + n * 0.005)
            adopt(tube(f'{name}.{side}', arc, 0.024, M['ink']), head, moods)

        # worried brows: inner ends up
        brow = []
        for dx, dz in ((0.12, 0.17), (-0.10, 0.24)):
            l, n = at((0.31 + dx) * s, dz)
            brow.append(l + n * 0.008)
        adopt(tube(f'Brow.{side}', brow, 0.022, M['ink']), head, 'worried')

        loc, nor = at(0.56 * s, -0.20)
        adopt(sphere(f'Blush.{side}', loc + nor * 0.004, (0.10, 0.065, 0.012), M['blush'], facing(nor)), head)
        loc, nor = at(0.075 * s, -0.23)
        adopt(sphere(f'Muzzle.{side}', loc - nor * 0.04, (0.105, 0.085, 0.08), M['cream'], facing(nor)), head)

        # reading glasses
        loc, nor = at(0.31 * s, -0.02)
        q = facing(nor); up = q @ Vector((0, 1, 0)); right = q @ Vector((1, 0, 0))
        ring = [loc + nor * 0.07 + (right * math.cos(a) + up * math.sin(a)) * 0.165 for a in (i * math.pi / 4 for i in range(8))]
        adopt(tube(f'Lens.{side}', ring, 0.016, M['ink'], cyclic=True), head, 'reading')

    l1, n1 = at(0.15, 0.0); l2, n2 = at(-0.15, 0.0)
    adopt(tube('Bridge', [l1 + n1 * 0.07, (l1 + l2) / 2 + Vector((0, -0.08, 0.03)), l2 + n2 * 0.07], 0.014, M['ink']), head, 'reading')

    loc, nor = at(0, -0.165)
    adopt(sphere('Nose', loc + nor * 0.035, (0.05, 0.036, 0.032), M['pink'], facing(nor)), head)

    def mouth_line(name, pts, moods):
        line = []
        for x, dz in pts:
            l, n = hit(x, hz + dz)
            line.append(l + n * 0.004)
        adopt(tube(name, line, 0.011, M['toast']), head, moods)

    mouth_line('MouthW', ((-0.085, -0.275), (-0.04, -0.302), (0.0, -0.282), (0.04, -0.302), (0.085, -0.275)), '-celebrate -worried')
    mouth_line('MouthWavy', ((-0.08, -0.29), (-0.04, -0.276), (0.0, -0.29), (0.04, -0.276), (0.08, -0.29)), 'worried')
    loc, nor = hit(0, hz - 0.30)
    adopt(sphere('MouthOpen', loc - nor * 0.01, (0.075, 0.065, 0.03), M['mouth'], facing(nor)), head, 'celebrate')
    adopt(sphere('Tongue', loc + nor * 0.012 - Vector((0, 0, 0.025)), (0.045, 0.026, 0.02), M['pink'], facing(nor)), head, 'celebrate')

    # toasted forehead marks
    for i, (dx, top, bot) in enumerate(((-0.16, 0.52, 0.38), (0.0, 0.56, 0.34), (0.16, 0.52, 0.38))):
        pts, radii = [], []
        for j in range(5):
            z = top + (bot - top) * j / 4
            l, n = at(dx * (1 - 0.15 * j / 4), z)
            pts.append(l - n * 0.006); radii.append(1.0 - 0.6 * j / 4)
        adopt(tube(f'Mark.{i}', pts, 0.032, M['toast'], radii), head)

    # worried sweat drop
    loc, nor = at(0.70, 0.30)
    sweat = teardrop('Sweat', 0.07, 0.2, (M['sky'],), taper=0.95)
    sweat.matrix_world = Matrix.Translation(loc + nor * 0.06) @ Matrix.Rotation(math.radians(-15), 4, 'Y')
    adopt(sweat, head, 'worried')

    # ears: pivots at the base
    for s, side in ((1, 'L'), (-1, 'R')):
        h = 0.62
        rot = Matrix.Rotation(math.radians(26 * s), 4, 'Y') @ Matrix.Rotation(math.radians(8), 4, 'X')
        centre = head_c + Vector((0.52 * s, 0.04, 0.53))
        base = centre + rot.to_3x3() @ Vector((0, 0, -h / 2 + 0.08))
        ear = pivot(f'Ear.{side}', base, head)
        e = teardrop(f'EarShell.{side}', 0.34, h, (M['coat'], M['toast']), tip_from=0.70, taper=0.72)
        e.matrix_world = Matrix.Translation(centre) @ rot @ Matrix.Diagonal((1, 0.55, 1, 1))
        sub = e.modifiers.new('sub', 'SUBSURF'); sub.levels = sub.render_levels = 1
        adopt(e, ear)
        inner = teardrop(f'EarInner.{side}', 0.22, 0.42, (M['pink'],), taper=0.78)
        inner.matrix_world = Matrix.Translation(centre) @ rot @ Matrix.Diagonal((1, 0.55, 1, 1)) @ Matrix.Translation((0, -0.20, -0.07)) @ Matrix.Diagonal((1, 0.22, 1, 1))
        adopt(inner, ear)

    # pencil behind the right (viewer's right) ear
    L = 0.72
    axis = Vector((0.85, -0.20, 0.45)).normalized()
    q = axis.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    origin = head_c + Vector((0.55, 0.24, 0.70))
    for name, r1, r2, d, z, mat, segs in (
        ('PencilShaft', 0.058, 0.058, L, 0, 'pencil', 6),
        ('PencilWood', 0.058, 0.015, 0.13, L / 2 + 0.065, 'wood', 6),
        ('PencilLead', 0.016, 0.002, 0.04, L / 2 + 0.145, 'lead', 12),
        ('PencilFerrule', 0.062, 0.062, 0.07, -L / 2 - 0.035, 'ferrule', 16),
        ('PencilEraser', 0.059, 0.055, 0.07, -L / 2 - 0.10, 'eraser', 16),
    ):
        c = cone(name, r1, r2, d, M[mat], segs=segs)
        c.matrix_world = Matrix.Translation(origin) @ q @ Matrix.Translation((0, 0, z))
        adopt(c, head)

    # reading: a receipt held in both paws
    if not lie:
        slip_rot = Matrix.Rotation(math.radians(-14), 4, 'X')
        slip_at = Vector((0, -0.66, 0.66))
        outline = [(-0.24, 0.30), (0.24, 0.30), (0.24, -0.26)]
        teeth = 8
        for i in range(teeth + 1):
            x = 0.24 - 0.48 * i / teeth
            outline.append((x, -0.26 + (0.035 if i % 2 else 0)))
        me = bpy.data.meshes.new('Slip')
        bm = bmesh.new()
        verts = [bm.verts.new((x, 0, z)) for x, z in outline]
        bm.faces.new(verts)
        bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.012)
        bm.to_mesh(me); bm.free()
        slip = link('Slip', me, M['paper'])
        slip.matrix_world = Matrix.Translation(slip_at) @ slip_rot
        adopt(slip, root, 'reading')
        for i, (x0, x1, z) in enumerate(((-0.16, 0.06, 0.18), (-0.16, 0.16, 0.08), (-0.16, 0.10, -0.02), (-0.16, 0.16, -0.12))):
            a = slip_rot.to_3x3() @ Vector((x0, -0.02, z)) + slip_at
            b = slip_rot.to_3x3() @ Vector((x1, -0.02, z)) + slip_at
            adopt(tube(f'SlipLine.{i}', [a, b], 0.009, M['toast']), root, 'reading')
        for s, side in ((1, 'L'), (-1, 'R')):
            adopt(sphere(f'PawHold.{side}', slip_at + Vector((0.25 * s, -0.04, -0.02)), (0.12, 0.11, 0.13), M['cream']), root, 'reading')

    # --- scene props
    if 'icecream' in props:
        paw = Vector((0.34, -0.60, 0.70))
        adopt(sphere('PawCone', paw, (0.12, 0.11, 0.12), M['cream']), root)
        c = cone('Cone', 0.11, 0.015, 0.36, M['waffle'], segs=24)
        c.matrix_world = Matrix.Translation(paw + Vector((0.02, -0.02, 0.12))) @ Matrix.Rotation(math.pi, 4, 'X')
        adopt(c, root)
        adopt(sphere('Scoop', paw + Vector((0.02, -0.02, 0.36)), (0.13, 0.13, 0.12), M['scoop']), root)
    if 'umbrella' in props:
        top = Vector((0.18, 0.05, 2.72))
        me = bpy.data.meshes.new('Canopy')
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=1)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.05], context='VERTS')
        for v in bm.verts:  # scalloped rim between eight ribs
            a = math.atan2(v.co.y, v.co.x)
            if v.co.z < 0.25:
                v.co.z += 0.08 * abs(math.sin(a * 4))
        bm.to_mesh(me); bm.free(); smooth(me)
        can = link('Canopy', me, M['yellow'])
        can.matrix_world = Matrix.Translation(top) @ Matrix.Diagonal((1.02, 1.02, 0.46, 1))
        sol = can.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = 0.03
        adopt(can, root)
        grip = Vector((0.62, -0.40, 0.95))
        adopt(tube('Shaft', [top + Vector((0, 0, 0.46)), grip], 0.025, M['handle']), root)
        adopt(tube('Hook', [grip, grip + Vector((0.0, -0.05, -0.16)), grip + Vector((0.10, -0.06, -0.20)), grip + Vector((0.14, -0.05, -0.12))], 0.03, M['handle']), root)
        adopt(sphere('PawGrip', grip + Vector((0, -0.02, 0.06)), (0.12, 0.11, 0.12), M['cream']), root)

    return dict(root=root, head=head)


# ---------------------------------------------------------------- posing for stills
def set_mood(mood, piv):
    """Show this mood's props and pose the head and ears like the app does."""
    for o in bpy.data.objects:
        rule = o.get('moods')
        if rule is None:
            continue
        words = rule.split()
        show = mood not in [w[1:] for w in words] if words[0].startswith('-') else mood in words
        for x in [o, *o.children_recursive]:
            x.hide_render = not show
    pose = POSES[mood]
    pitch, yaw, roll = (math.radians(a) for a in pose['head'])
    piv['head'].rotation_euler = (pitch, roll, yaw)
    for side, s in (('L', 1), ('R', -1)):
        bpy.data.objects[f'Ear.{side}'].rotation_euler = (0, math.radians(pose['ears']) * s, 0)


# ---------------------------------------------------------------- stage
def stage(lights='studio', paper=False, shadow=True):
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True
    scene.render.film_transparent = not paper
    scene.view_settings.view_transform = 'Standard'

    world = bpy.data.worlds.new('w'); scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    night = lights == 'night'
    nt.nodes['Background'].inputs['Color'].default_value = lin('#2A3358' if night else '#F3ECE0')
    nt.nodes['Background'].inputs['Strength'].default_value = 0.6 if night else 0.5
    if paper:
        lp = nt.nodes.new('ShaderNodeLightPath'); bg = nt.nodes.new('ShaderNodeBackground'); mix = nt.nodes.new('ShaderNodeMixShader')
        bg.inputs['Color'].default_value = lin('#F6F0E4'); bg.inputs['Strength'].default_value = 1.0
        nt.links.new(lp.outputs['Is Camera Ray'], mix.inputs[0])
        nt.links.new(nt.nodes['Background'].outputs[0], mix.inputs[1]); nt.links.new(bg.outputs[0], mix.inputs[2])
        nt.links.new(mix.outputs[0], nt.nodes['World Output'].inputs['Surface'])

    if shadow:
        me = bpy.data.meshes.new('Ground')
        bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=6); bm.to_mesh(me); bm.free()
        link('Ground', me).is_shadow_catcher = True

    def area(name, loc, energy, size, hex_):
        li = bpy.data.lights.new(name, 'AREA'); li.energy = energy; li.size = size; li.color = lin(hex_)[:3]
        o = bpy.data.objects.new(name, li); col.objects.link(o); o.location = loc
        o.rotation_mode = 'QUATERNION'
        o.rotation_quaternion = (Vector((0, 0, 1.0)) - Vector(loc)).to_track_quat('-Z', 'Y')

    if night:
        area('Key', (-3.2, -4.0, 5.0), 380, 3.5, '#C9D6FF')
        area('Fill', (4.0, -3.0, 1.8), 120, 4.0, '#8FA3E8')
        area('Rim', (1.5, 4.5, 4.0), 900, 2.5, '#FFE3A8')
    else:
        area('Key', (-3.2, -4.0, 5.0), 650, 3.5, '#FFF4E6')
        area('Fill', (4.0, -3.0, 1.8), 160, 4.0, '#E6EEFF')
        area('Rim', (1.5, 4.5, 4.0), 700, 2.5, '#FFFFFF')


# The app's live view uses this same camera so a still and the live cat line up.
CAMERA = dict(az=22, el=10, dist=5.8, target=(0, 0, 1.25), lens=70)


def camera(az=CAMERA['az'], el=CAMERA['el'], dist=CAMERA['dist'], target=CAMERA['target'], lens=CAMERA['lens']):
    scene = bpy.context.scene
    data = bpy.data.cameras.new('Cam'); data.lens = lens; data.sensor_fit = 'VERTICAL'; data.sensor_height = 36
    cam = bpy.data.objects.new('Cam', data); col.objects.link(cam); scene.camera = cam
    a, e = math.radians(az), math.radians(el)
    t = Vector(target)
    cam.location = t + Vector((dist * math.sin(a) * math.cos(e), -dist * math.cos(a) * math.cos(e), dist * math.sin(e)))
    cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = (t - cam.location).to_track_quat('-Z', 'Y')
    return cam


def render(path, w, h, fmt='WEBP'):
    scene = bpy.context.scene
    scene.render.resolution_x, scene.render.resolution_y = w, h
    s = scene.render.image_settings
    s.file_format = fmt
    s.color_mode = 'RGBA'
    if fmt == 'WEBP':
        s.quality = 88
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print('RENDERED', path)


def fresh():
    global col
    bpy.ops.wm.read_factory_settings(use_empty=True)
    col = bpy.context.scene.collection
    return make_materials()


# ---------------------------------------------------------------- tasks
os.makedirs(OUT, exist_ok=True)

if 'preview' in TASKS or 'stills' in TASKS:
    M = fresh()
    piv = build(M)
    preview = 'preview' in TASKS
    stage(paper=preview)
    camera()
    for mood in MOODS:
        set_mood(mood, piv)
        if preview:
            render(os.path.join(OUT, f'preview-{mood}.png'), 700, 700, 'PNG')
        else:
            render(os.path.join(OUT, f'khaotang-{mood}.webp'), 480, 480)

if 'scenes' in TASKS:
    for scene_name, pose, props, mood, cam, size in (
        ('beach', 'sit', ('icecream',), 'happy', {}, (480, 480)),
        ('monsoon', 'sit', ('umbrella', 'boots'), 'happy', dict(dist=7.4, target=(0, 0, 1.62)), (480, 560)),
        ('stars', 'lie', (), 'happy', dict(az=52, el=12, dist=6.4, target=(0, 0.35, 0.80)), (640, 440)),
    ):
        M = fresh()
        piv = build(M, pose, props)
        set_mood(mood, piv)
        if pose == 'lie':
            piv['head'].rotation_euler = (math.radians(-18), math.radians(-6), math.radians(28))  # gazing up at the sky, face to the camera
        stage(lights='night', shadow=pose != 'lie')
        camera(**cam)
        render(os.path.join(OUT, f'khaotang-{scene_name}.webp'), *size)

if 'glb' in TASKS:
    M = fresh()
    build(M)
    for o in bpy.data.objects:
        o.hide_render = False
        o.select_set(True)
    bpy.context.view_layer.update()
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(OUT, 'khaotang.glb'), export_format='GLB', use_selection=True,
        export_apply=True, export_extras=True, export_yup=True, export_cameras=False, export_lights=False,
        export_animations=False, export_texcoords=False,
    )
    print('EXPORTED', os.path.join(OUT, 'khaotang.glb'))
