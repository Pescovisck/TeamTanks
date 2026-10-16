property pos, pmod, pdummy, hit, plifetime, pname, pid, pteam, pmusdata, poldmloc, phangtime, pdone
global gmem, ghvk, gsmokes, goody, gmodinc, gshadows

on new me, npos, nrot, nam, nteam, nid
  pteam = nteam
  pname = nam
  hit = 0
  rot = nrot
  pos = npos
  pid = nid
  playsound(pos, "rcbombrelease", 7)
  rot.x = 0
  speed = angtovec(rot)
  pos = pos + (speed * goody.bsp * 4)
  speed = speed * 50
  pmusdata = [0, 0]
  pmod = recyclemodel(#rcbombme)
  if pmod = 0 then
    gmodinc = gmodinc + 1
    pmod = gmem.model("rcbomb").clone("rcbomb" & gmodinc)
    pmod.removeFromWorld()
    pmod.transform.position = pos
    pmod.transform.rotation = rot
    pmod.transform.scale = vector(1, 1, 1) * 2
    pdummy = ghvk.make_rb(pmod, #convexshape, #dynamic)
    if not voidp(goody.pdummy) then
      goody.pphysx.DisableCollision(goody.pdummy, pdummy)
      goody.pphysx.DisableCollision(goody.pwfl, pdummy)
      goody.pphysx.DisableCollision(goody.pwfr, pdummy)
      goody.pphysx.DisableCollision(goody.pwbl, pdummy)
      goody.pphysx.DisableCollision(goody.pwbr, pdummy)
    end if
    pdummy.mass = 10
    pdummy.centerOfMass = vector(0, 0, -6)
    pdummy.friction = 0.10000000000000001
    pdummy.restitution = 0
  else
    pdummy = ghvk.pphysx.getRigidBody(pmod.name)
    pdummy.isPinned = 0
    pmod.transform.position = pos
    pmod.transform.rotation = rot
    pdummy.orientation = pmod.transform.axisAngle
  end if
  pmod.shaderList = shady(pteam & "rcbomb")
  pmod.addToWorld()
  pdummy.position = pos
  pdummy.angularVelocity = vector(0, 0, 0)
  plifetime = 0
  phangtime = 1100
  pdone = 0
  _mouse.mouseLoc = point(400, 300)
  poldmloc = point(400, 300)
  pmod.parent = gsmokes
  sound(1).play([#member: member("rcbeep"), #rateShift: -1])
  (the actorList).add(me)
  return me
end

on stepFrame me
  if not voidp(goody) then
    plifetime = plifetime + 1
    gsmokes.removeFromWorld()
    vray = gmem.modelsUnderRay(pos, vector(0.01, 0, -0.98999999999999999), [#maxNumberOfModels: 1, #levelOfDetail: #detailed, #maxDistance: pmod.boundingSphere[2] * 2])
    gsmokes.addToWorld()
    vonfloor = 0
    if vray.count > 0 then
      vpos = vray[1].isectPosition + (vray[1].isectNormal * 2)
      gmem.model("carshad").transform.position = vpos
      vfac = 4 / vray[1].distance
      if vfac > 0 then
        gmem.model("carshad").transform.scale = vector(1, 1, 1) * vfac
        gmem.model("carshad").shader.blend = vfac * 200
      end if
      gmem.model("carshad").pointAt(vray[1].isectPosition)
      if vray[1].distance < (pmod.boundingSphere[2] * 0.69999999999999996) then
        vonfloor = 1
      end if
    else
      if not pdone then
        diequiet(me)
      end if
    end if
    wtf = transform()
    wtf.rotation = pmod.transform.rotation
    vdown = wtf * vector(0, 0, -1)
    if vonfloor and (vdown.z < -0.20000000000000001) then
      if the mouseDown or keyPressed(126) or keyPressed("w") or keyPressed("w") then
        pdummy.linearVelocity = vector(0, 0, 0)
        goody.weapons.setaProp(goody.pweapon, goody.weapons.getaProp(goody.pweapon) - 1)
        push = vector(0, 0, 0)
        if pdummy.linearVelocity.magnitude < 30 then
          vrot = pmod.transform.rotation
          vrot.x = 0
          pdummy.linearVelocity = angtovec(vrot) * 20
        end if
      else
        pdummy.linearVelocity = pdummy.linearVelocity * 0.001
        pdummy.angularVelocity = pdummy.angularVelocity * 0.001
        pdummy.linearVelocity = pdummy.linearVelocity + vector(0, 0, -2)
      end if
    else
      pdummy.linearVelocity = pdummy.linearVelocity + vector(0, 0, -2)
    end if
    if goody.pgunmode then
      goody.pcursorlock = 0
      mousemov = poldmloc - the mouseLoc
      vturn = mousemov.locH
      _mouse.mouseLoc = point(400, 300)
      poldmloc = the mouseLoc
    else
      if keyPressed(123) or keyPressed("a") or keyPressed("A") or keyPressed(124) or keyPressed("d") or keyPressed("D") then
        vturn = (keyPressed(123) or keyPressed("a") or keyPressed("A")) - (keyPressed(124) or keyPressed("d") or keyPressed("D"))
        vturn = vturn * 13
      else
        vturn = vturn * 0.10000000000000001
      end if
    end if
    if vturn > 35 then
      vturn = 35
    else
      if vturn < -35 then
        vturn = -35
      end if
    end if
    pdummy.angularVelocity = vector(0, 0, vturn * 0.005)
    if not pdone then
      goody.weapons.setaProp(goody.pweapon, goody.weapons.getaProp(goody.pweapon) - 1)
      vcamtarpos = pmod.transform.position - (angtovec(pmod.transform.rotation + vector(-20, 0, 0)) * 80)
      vdel = vcamtarpos - goody.pcam.transform.position
      goody.pcam.transform.position = goody.pcam.transform.position + (vdel * 0.10000000000000001)
      goody.pcam.pointAt(pdummy.position, vector(0, 0, 1))
    else
      vwobble = vector(random(3) - 2, random(3) - 2, random(3) - 2)
      goody.pcam.rotate(vwobble, #self)
    end if
    pos = pdummy.position
    rot = pmod.transform.rotation
    pmusdata = [pos, rot]
    if the rightMouseDown and not pdone then
      bang(me)
    end if
    if the controlDown and (plifetime > 100) and not pdone then
      bang(me)
    end if
    if plifetime > phangtime then
      die(me)
    end if
    if (plifetime > 1000) or (goody.pweapon <> #rcbomb) or (goody.pstate = "repos") then
      bang(me)
      die(me)
    else
      if goody.pstate = "end" then
        diequiet(me)
      end if
    end if
  end if
end

on bang me
  sound(1).stop()
  submitmus([#subject: "detonate", #content: [#pid: pname & "rcbomb"]])
  pdone = 1
  phangtime = plifetime + 30
  bang = script("bangs").new(pos, "rcbomb", pname)
  storemodel(#rcbombme, pmod)
  pdummy.position = vector(0, 0, -1000)
  pdummy.isPinned = 1
end

on diequiet me
  sound(1).stop()
  storemodel(#rcbombme, pmod)
  pdummy.position = vector(0, 0, -1000)
  pdummy.isPinned = 1
  die(me)
end

on die me
  goody.pcursorlock = 1
  goody.weapons.setaProp(goody.pweapon, 0)
  goody.weaponry.premote = VOID
  (the actorList).deleteOne(me)
end
