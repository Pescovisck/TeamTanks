property pfuel, poldmloc, pmod, prot, poldgunmode, pActive
global gmem, goody, gsmokes, gmodinc

on new me, npos, nnor
  pfuel = 100000
  poldmloc = the mouseLoc
  pmod = recyclemodel(#thrust)
  if pmod = 0 then
    gmodinc = gmodinc + 1
    pmod = gmem.model("thrust").clone("thrust" & gmodinc)
  end if
  pmod.visibility = #both
  pmod.shaderList = shady("thrust")
  pmod.shader.texture.nearFiltering = 1
  pmod.shader.texture.renderFormat = #rgba8888
  pmod.shader.emissive = rgb(255, 255, 255)
  pmod.shader.blend = 100
  pmod.shader.textureTransform.scale = vector(1, 1, 1) * 2
  flicker(me)
  pActive = 0
  pmod.parent = goody.pmod
  pmod.transform.position = vector(0, 0, 0)
  prot = vector(0, 0, 0)
  puppetSound(1, "jetengine")
  (the actorList).add(me)
  return me
end

on stepFrame me
  vdwn = goody.wtf * vector(0, 0, -1)
  if (the mouseDown or the controlDown) and (vdwn.z < -0.20000000000000001) then
    vdelta = vector(-1.19999999999999996, 0, 0) - goody.prot
    goody.prot = goody.prot + (vdelta * 0.04)
    vpow = 90
    goody.pwfl.applyLinearImpulse(goody.wtf * vector(0, 0, 1) * vpow, vector(0, 3, 0))
    goody.pwfr.applyLinearImpulse(goody.wtf * vector(0, 0, 1) * vpow, vector(0, 3, 0))
    goody.pwbl.applyLinearImpulse(goody.wtf * vector(0, 0, 1) * vpow, vector(0, 3, 0))
    goody.pwbr.applyLinearImpulse(goody.wtf * vector(0, 0, 1) * vpow, vector(0, 3, 0))
    vtorq = vector(0, 0, 0)
    if goody.pgunmode then
      goody.pcursorlock = 0
      mousemov = poldmloc - the mouseLoc
      vtorq.z = mousemov.locH * 0.05
      vtorq.x = mousemov.locV * 0.05
      _mouse.mouseLoc = point(400, 300)
      poldmloc = the mouseLoc
    else
      vturn = 0.10000000000000001
      vvx = (keyPressed(123) or keyPressed("a") or keyPressed("A")) - (keyPressed(124) or keyPressed("d") or keyPressed("D"))
      vtorq.z = -float(vvx) * vturn
      vvy = (keyPressed(126) or keyPressed("w") or keyPressed("w")) - (keyPressed(125) or keyPressed("s") or keyPressed("S"))
      vtorq.x = -float(vvy) * vturn
    end if
    vmaxtorq = 0.20000000000000001
    if vtorq.z > vmaxtorq then
      vtorq.z = vmaxtorq
    else
      if vtorq.z < -vmaxtorq then
        vtorq.z = -vmaxtorq
      end if
    end if
    if vtorq.x > vmaxtorq then
      vtorq.x = vmaxtorq
    else
      if vtorq.x < -vmaxtorq then
        vtorq.x = -vmaxtorq
      end if
    end if
    prot.z = prot.z + vtorq.z
    prot.x = prot.x + vtorq.x
    prot = prot * 0.40000000000000002
    goody.pdummy.angularVelocity = goody.wtf * vector(prot.x, prot.z, 0)
    flicker(me)
    pmod.visibility = #both
    sound(1).volume = 100
    pActive = 1
  else
    prot = vector(0, 0, 0)
    sound(1).volume = 0
    pmod.visibility = #none
    pActive = 0
    goody.pcursorlock = 1
  end if
  if (pfuel = 0) or (goody.pweapon <> #thrusters) or (goody.pstate = "repos") or (goody.pstate = "end") then
    die(me)
  end if
  pfuel = pfuel - 1
end

on flicker me
  vxqwe = random(2) - 1
  vyqwe = random(2) - 1
  pmod.shader.textureTransform.position = vector(vxqwe, -vyqwe, 0)
end

on die me
  sound(1).stop()
  storemodel(#thrust, pmod)
  goody.pcursorlock = 1
  goody.weaponry.pthruster = VOID
  (the actorList).deleteOne(me)
end
