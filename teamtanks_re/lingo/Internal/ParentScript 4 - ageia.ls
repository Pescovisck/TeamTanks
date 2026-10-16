property pphysx, landsc
global gmem, goody, glevel

on new me, npos
  pphysx = member("physx")
  if pphysx.IsInitialized then
    pphysx.destroy()
  end if
  ptol = 0.10000000000000001
  pScale = 1
  pphysx.init(gmem, vector(pScale, pScale, pScale), #equal, 1, 15)
  pphysx.gravity = vector(0.0, 0.0, -1)
  pphysx.contactTolerance = ptol
  pphysx.friction = 0
  pphysx.restitution = 0.10000000000000001
  setupmodels(me)
  (the actorList).add(me)
  return me
end

on setupmodels me
  repeat with i = 1 to gmem.model.count
    modo = gmem.model[i]
    if (modo.name contains "ramp") or (modo.name contains "loop") or (modo.name contains "twist") or (modo.name contains "spawn") or (modo.name contains "capture") then
      modo.addToWorld()
      vitem = make_rb(me, modo, #concaveshape, #static)
      vitem.friction = 1
      vitem.restitution = 0.01
      next repeat
    end if
    if modo.name contains "physbox" then
      modo.addToWorld()
      vlandsc = make_rb(me, modo, #concaveshape, #static)
      vlandsc.friction = 0
      vlandsc.restitution = 0.01
      modo.removeFromWorld()
      next repeat
    end if
    if modo.name contains "ground" then
      vlandsc = make_rb(me, modo, #concaveshape, #static)
      vlandsc.friction = glevel.friction
      vlandsc.restitution = 0.01
    end if
  end repeat
end

on stepFrame me
  pphysx.simulate()
end

on make_rb me, modo, convo, mov
  if pphysx.getRigidBody(modo.name) = 0 then
    if not getPos(modo.modifier, #meshDeform) then
      modo.addModifier(#meshDeform)
    end if
    rb = pphysx.createRigidBody(modo.name, modo.name, convo, mov)
  else
    rb = pphysx.getRigidBody(modo.name)
  end if
  rb.mass = 1
  return rb
end

on makedummy me, radius, who
  if voidp(gmem.modelResource(string(radius))) then
    nmr = gmem.newModelResource(string(radius), #sphere, #front)
    nmr.radius = radius
    nmr.resolution = 20
  else
    nmr = gmem.modelResource(string(radius))
  end if
  if who = goody then
    modo = gmem.newModel("goody dummy", nmr)
  else
    modo = gmem.newModel(who.pmod.name & "dummy", nmr)
  end if
  modo.addModifier(#meshDeform)
  rb = pphysx.createRigidBody(modo.name, modo.name, #convexshape, #dynamic)
  rb.friction = 0
  rb.mass = 100
  rb.restitution = 0.01
  modo.removeFromWorld()
  return rb
end

on removethefella me, modo
  pphysx.deleteRigidBody(modo.name)
end

on addsus me, rb_tyre, rb_car, i, oset, iset
  joint = pphysx.createD6Joint("sus_" & rb_tyre.name, rb_car, rb_tyre, vector(1, 1, 1))
  joint.localAnchorA = oset
  joint.localAnchorB = iset
  joint.localAxisA = vector(1, 0, 0)
  joint.localNormalA = vector(0, 1, 0)
  joint.localAxisB = vector(1, 0, 0)
  joint.localNormalB = vector(0, 1, 0)
  joint.linearLimit = [3, 50, 50, 1]
  joint.AxisMotion = #locked
  joint.NormalMotion = #locked
  joint.BinormalMotion = #limited
  joint.twistMotion = #free
  joint.swing1Motion = #locked
  if (rb_tyre.name contains "wfl") or (rb_tyre.name contains "wfr") then
    joint.swing2Limit = [3.14000000000000012 * 0.40000000000000002, 10, 1, 1]
    joint.swingDrive = [#velocity, 8000, 1, 1000]
    joint.swing2Motion = #limited
  else
    joint.swing2Motion = #locked
  end if
end
