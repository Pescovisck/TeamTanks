property pos, speed, pmod, pid, hit, plifetime, phangtime, pdone, pname, pteam, pmusdata, poldm, pmom, ptorq, vpush, pthruster
global gmem, gsmokes, goody, gmodinc, gplayers

on new me, npos, nrot, nam, nteam, nid
  pteam = nteam
  pname = nam
  hit = 0
  rot = nrot
  pos = npos
  playsound(pos, "reoffrock", 7)
  pid = nid
  sound(1).play([#member: member("jetengine"), #rateShift: 8])
  speed = angtovec(rot)
  pos = pos + (speed * goody.bsp * 5)
  speed = speed * 80
  pmod = recyclemodel(#rcrocket)
  if pmod = 0 then
    gmodinc = gmodinc + 1
    pmod = gmem.model("rcrocket").clone("rcrocket" & gmodinc)
  end if
  pmod.addToWorld()
  pmod.transform.position = pos
  pmod.transform.rotation = rot
  pmod.shaderList = shady(pteam & "rcrocket")
  poldm = the mouseLoc
  ptorq = vector(0, 0, 0)
  pmom = vector(0, 0, 0)
  vpush = 10
  pmusdata = [0, 0]
  pthruster = recyclemodel(#plane)
  if pthruster = 0 then
    pthruster = planemake()
  end if
  pthruster.parent = pmod
  pthruster.transform.position = vector(0, 0, -20)
  pthruster.transform.rotation = vector(0, 0, 0)
  pthruster.transform.scale = vector(1, 1, 1) * 0.01
  pthruster.visibility = #none
  plifetime = 0
  phangtime = 1100
  pdone = 0
  (the actorList).add(me)
  return me
end

on stepFrame me
  if not voidp(goody) then
    plifetime = plifetime + 1
    pos = pmod.transform.position
    steer(me)
    pthruster.removeFromWorld()
    touch(me)
    pmod.transform.position = pos + vector(0, 0, -3)
    pthruster.addToWorld()
    pthruster.transform.position = vector(0, -30, 3)
    pthruster.parent = pmod
    dosounds(me)
    camcontrol(me)
    vp = pthruster.getWorldTransform().position
    puff(me, vp, "rcrocket")
    pmusdata = [pos, pmod.transform.rotation]
    if plifetime > phangtime then
      die(me)
    end if
    if (plifetime > 1000) or (goody.pweapon <> #rcrocket) or (goody.pstate = "repos") then
      bang(me)
      die(me)
    else
      if goody.pstate = "end" then
        diequiet(me)
      end if
    end if
  end if
end

on dosounds me
  vp = (vpush - 6) * 3
  if vp <= 80 then
    sound(1).volume = vp
  end if
end

on steer me
  if not pdone then
    goody.weapons.setaProp(goody.pweapon, goody.weapons.getaProp(goody.pweapon) - 1)
    if goody.pgunmode then
      goody.pcursorlock = 0
      if the mouseDown or the controlDown then
        if vpush < 24 then
          vpush = vpush * 1.03000000000000003
        end if
      else
        if vpush > 10 then
          vpush = vpush * 0.96999999999999997
        end if
      end if
      if the rightMouseDown and (pdone = 0) then
        bang(me)
      end if
    else
      if the controlDown and (plifetime > 100) and (pdone = 0) then
        bang(me)
      end if
      vpush = 20
    end if
    tournez = 0.20000000000000001
    vmturn = the mouseLoc - poldm
    vtorq = vector(0, 0, 0)
    vtorq.x = vmturn.locV * -0.05
    vtorq.z = vmturn.locH * -0.05
    vtorq.y = vmturn.locH * 0.01
    _mouse.mouseLoc = point(400, 300)
    poldm = the mouseLoc
    if keyPressed(124) then
      vtorq.z = vtorq.z - (tournez * 0.59999999999999998)
      vtorq.y = vtorq.y + (tournez * 0.01)
    else
      if keyPressed(123) then
        vtorq.z = vtorq.z + (tournez * 0.59999999999999998)
        vtorq.y = vtorq.y - (tournez * 0.01)
      end if
    end if
    if keyPressed(125) then
      vtorq.x = vtorq.x + (tournez * 0.59999999999999998)
    else
      if keyPressed(126) then
        vtorq.x = vtorq.x - (tournez * 0.59999999999999998)
      end if
    end if
    vmaxtorq = 0.20000000000000001
    if vtorq.x > vmaxtorq then
      vtorq.x = vmaxtorq
    else
      if vtorq.x < -vmaxtorq then
        vtorq.x = -vmaxtorq
      end if
    end if
    if vtorq.y > vmaxtorq then
      vtorq.y = vmaxtorq
    else
      if vtorq.y < -vmaxtorq then
        vtorq.y = -vmaxtorq
      end if
    end if
    if vtorq.z > vmaxtorq then
      vtorq.z = vmaxtorq
    else
      if vtorq.z < -vmaxtorq then
        vtorq.z = -vmaxtorq
      end if
    end if
    if vtorq.magnitude = 0 then
      ptorq = ptorq * 0.80000000000000004
    else
      ptorq = ptorq + vtorq
    end if
    ptorq = ptorq * 0.98999999999999999
    vtargetspeed = angtovec(pmod.transform.rotation) * vpush
    pmom = pmom + ((vtargetspeed - pmom) * 0.05)
    if pmom.magnitude > 100 then
      pmom.normalize()
      pmom = pmom * 100
    end if
    wtf = transform()
    wtf.rotation = pmod.transform.rotation
    roll = wtf * vector(-1, 0, 0)
    if roll.x < -0.20000000000000001 then
      ptorq.y = 0
    end if
    pmod.rotate(ptorq, #self)
    pos = pos + pmom
  end if
end

on camcontrol me
  if pdone = 0 then
    vcamtarpos = pmod.transform.position - (angtovec(pmod.transform.rotation + vector(-40, 0, 0)) * 150)
    vdel = vcamtarpos - goody.pcam.transform.position
    goody.pcam.transform.position = goody.pcam.transform.position + (vdel * 0.10000000000000001)
    goody.pcam.pointAt(pmod.transform.position, vector(0, 0, 1))
  else
    vwobble = vector(random(3) - 2, random(3) - 2, random(3) - 2)
    goody.pcam.rotate(vwobble, #self)
  end if
end

on touch me
  if not pdone then
    gsmokes.removeFromWorld()
    dirns = [vector(1, 0, 0), vector(-1, 0, 0), vector(0, 1, 0), vector(0, -1, 0), vector(0, 0, 1), vector(0, 0, -1)]
    repeat with i = 1 to dirns.count
      dirn = getnormal(pmod, dirns[i])
      hit = gmem.modelsUnderRay(pos, dirn, 1, #detailed)
      if hit.count >= 1 then
        if hit[1].distance < pmod.boundingSphere[2] then
          if (pmod.name <> hit[1].model.name) and (pdone = 0) then
            bang(me)
          end if
        end if
        next repeat
      end if
      if (hit.count = 0) and (dirns[i] = vector(0, 0, -1)) then
        bang(me)
      end if
    end repeat
    gsmokes.addToWorld()
  end if
end

on puff me, npos
  if pdone = 0 then
    vp = script("puff").new(npos, "rcrocket")
  end if
end

on bang me
  submitmus([#subject: "detonate", #content: [#pid: string(pname & "rcrocket")]])
  pdone = 1
  phangtime = plifetime + 30
  bang = script("bangs").new(pos, "rcrocket", pname)
  sound(1).stop()
  storemodel(#rcrocket, pmod)
  storemodel(#plane, pthruster)
end

on diequiet me
  sound(1).stop()
  storemodel(#rcrocket, pmod)
  storemodel(#plane, pthruster)
  die(me)
end

on die me
  goody.pcursorlock = 1
  goody.weapons.setaProp(goody.pweapon, 0)
  goody.weaponry.premote = VOID
  (the actorList).deleteOne(me)
end
