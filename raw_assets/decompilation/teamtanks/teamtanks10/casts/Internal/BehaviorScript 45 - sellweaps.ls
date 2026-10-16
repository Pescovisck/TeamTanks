property pweaplist, pcam, pteam, pmod, pphysx, pang, pdummy, phavwheels, pgun, pturret, pback, prot, protais, poldweap, ponfloor
global gmem

on beginSprite me
  gmem = sprite(me.spriteNum).member
  gmem.resetWorld()
  pcam = gmem.camera[1]
  gmem.bgColor = rgb(0, 0, 0)
  if random(2) = 2 then
    pteam = "red"
  else
    pteam = "blue"
  end if
  pweaplist = [#mgun, #bgun, #nook, #rocket, #proximitymine, #speed, #lasergun, #mgunx2, #rocketx4, #remotemine, #sonicgun, #guidedmissile, #thrusters, #mortar, #airstrike, #rcbomb, #rcrocket, #health, #stealth]
  buildworld(me)
  pang = 1
  if voidp(gmem.model("carshad")) then
    nmr = gmem.newModelResource("dummy", #plane)
    nmr.width = 120
    nmr.length = 120
    gmem.newModel("carshad", nmr)
    vs = shady("carshad")
    gmem.model("carshad").shaderList = vs
    gmem.model("carshad").visibility = #front
  end if
  ponfloor = 0
  protais = random(5)
  prot = vector(0, 0, 0)
  gmem.directToStage = 0
  sprite(me.spriteNum).locV = 250
  gmem.directToStage = 1
  repeat with i = 1 to gmem.light.count
    gmem.deleteLight(i)
  end repeat
  l = gmem.newLight("sun", #point)
  l.transform.position = vector(0, 0, 10000)
  l.color = rgb(230, 230, 230)
end

on setweap me, nweap
  if nweap <> poldweap then
    reload(me, nweap)
    poldweap = nweap
  end if
end

on makeentry me
  pphysx.DisableCollision(pdummy)
  pdummy.position = vector(0, 0, 300)
  vt = transform()
  vt.rotation = -vectoang(vector(0, 0, random(360)), pdummy.position)
  pdummy.orientation = vt.axisAngle
  pphysx.EnableCollision(pdummy)
  pdummy.linearVelocity = vector(0, 0, 0)
  pdummy.angularVelocity = vector(0, 0, 0)
  pdummy.angularMomentum = vector(0, 0, 0)
  pdummy.linearMomentum = vector(0, 0, 0)
  pphysx.RegisterCollisionCallback(#collisionCallback, me)
  pphysx.EnableCollisionCallback(pdummy)
  vside = 22
  vforbac = 22
  vhig = -15
  oset = [vector(-vside, vforbac + 3, vhig), vector(vside, vforbac + 3, vhig), vector(-vside, -vforbac + 3, vhig), vector(vside, -vforbac + 3, vhig)]
  repeat with i = 1 to phavwheels.count
    pphysx.DisableCollision(phavwheels[i])
    phavwheels[i].position = pdummy.position + oset[i]
    phavwheels[i].linearVelocity = vector(0, 0, 0)
    phavwheels[i].angularVelocity = vector(0, 0, 0)
    phavwheels[i].angularMomentum = vector(0, 0, 0)
    phavwheels[i].linearMomentum = vector(0, 0, 0)
    pphysx.EnableCollision(phavwheels[i])
    pphysx.DisableCollision(pdummy, phavwheels[i])
  end repeat
  pdummy.isPinned = 1
  pphysx.simulate()
  pdummy.isPinned = 0
end

on reload me, nweap
  nweap = string(nweap)
  nweap = value("#" & nweap)
  if ponfloor then
    makeentry(me)
  end if
  puppetSound("reload", 2)
  vgres = ["mgun", "bgun", "nooklauncher", "rocketlauncher", 0, 0, "lasergun", "mgunx2", "rocketlauncherx4", 0, "sonicgun", "guidedmissilelauncher", 0, "mortarlauncher", "airstrikelauncher", 0, "rcrocketlauncher", 0, 0]
  vtres = ["turret", "turret", "turret", "turretround", 0, 0, "laserturret", "turret", "turretround", 0, "turretround", "turretround", 0, "turretround", "turretround", "rcbomblauncher", "turretround", 0, 0]
  vbres = [0, 0, 0, 0, "minelauncher", "speed", 0, 0, 0, "minelauncher", 0, 0, "thrusters", 0, 0, 0, 0, "minelauncher", "stealth"]
  vtweap = pweaplist.getOne(nweap)
  if not vtweap then
    pgun.visibility = #none
    pturret.visibility = #none
    pback.visibility = #none
    pweapon = #none
  else
    if vgres[vtweap] = 0 then
      pgun.visibility = #none
    else
      pgun.visibility = #front
      pgun.resource = gmem.model(vgres[vtweap]).resource
      if (vgres[vtweap] = "mgun") or (vgres[vtweap] = "mgunx2") or (vgres[vtweap] = "bgun") then
        vs = shady(string(vgres[vtweap]))
        pgun.shaderList = vs
        vs.shininess = 90
      else
        if vgres[vtweap] = "rcrocketlauncher" then
          pgun.shaderList[1] = shady(pteam & "rocketlauncher")
          pgun.shaderList[2] = shady(pteam & "rcrocket")
        else
          if vgres[vtweap] = "rocketlauncherx4" then
            pgun.shaderList[1] = shady(pteam & "rocketlauncher")
            pgun.shaderList[2] = shady(pteam & "rocket")
          else
            if vgres[vtweap] = "airstrikelauncher" then
              vs = shady(pteam & "rocketlauncher")
              pgun.shaderList = vs
            else
              vs = shady(pteam & string(vgres[vtweap]))
              pgun.shaderList = vs
            end if
          end if
        end if
      end if
    end if
    if vtres[vtweap] = 0 then
      pturret.visibility = #none
    else
      pturret.visibility = #front
      pturret.resource = gmem.model(vtres[vtweap]).resource
      if vtres[vtweap] = "rcbomblauncher" then
        pturret.shaderList[1] = shady(pteam & "rocketlauncher")
        pturret.shaderList[2] = shady(pteam & "rcbomb")
      else
        if vtres[vtweap] = "laserturret" then
          vs = shady(pteam & string("lasergun"))
          vs.shininess = 90
          pturret.shaderList = vs
        else
          if vtres[vtweap] = "turretround" then
            vs = shady(string("turret"))
            vs.shininess = 90
            pturret.shaderList = vs
          else
            vs = shady(string(vtres[vtweap]))
            vs.shininess = 90
            pturret.shaderList = vs
          end if
        end if
      end if
    end if
    if vbres[vtweap] = 0 then
      pback.visibility = #none
    else
      pback.visibility = #front
      pback.resource = gmem.model(vbres[vtweap]).resource
      vs = shady(pteam & string(vbres[vtweap]))
      vs.shininess = 90
      pback.shaderList = vs
    end if
  end if
end

on exitFrame me
  pphysx.simulate()
  docams(me)
  grav = grav + vector(0, 0, -1)
  pdummy.linearVelocity = pdummy.linearVelocity + grav
  vray = gmem.modelsUnderRay(pmod.transform.position, vector(0.01, 0, -0.98999999999999999), [#maxNumberOfModels: 1, #levelOfDetail: #detailed, #modelList: [gmem.model("floor")], #maxDistance: pmod.boundingSphere[2] * 2])
  if vray.count > 0 then
    vpos = vray[1].isectPosition + (vray[1].isectNormal * 2)
    gmem.model("carshad").transform.position = vpos
    vfac = 4 / vray[1].distance
    if vfac > 0 then
      gmem.model("carshad").transform.scale = vector(1, 1, 1) * vfac * 7
      gmem.model("carshad").shader.blend = vfac * 400
    end if
    gmem.model("carshad").pointAt(vray[1].isectPosition)
    if vray[1].distance < (pmod.boundingSphere[2] * 0.69999999999999996) then
      ponfloor = 1
    else
      ponfloor = 0
    end if
  end if
  animweaps(me)
end

on animweaps me
  vrotais = [vector(1, 0, 2), vector(-1, 0, 2), vector(2, 0, 2), vector(-2, 0, 2), vector(1, 0, -1), vector(-1, 0, -2), vector(1, 0, -1), vector(1, 0, 2), vector(1, 0, -3), vector(1, 0, 3), vector(3, 0, -2)]
  if random(100) = 1 then
    protais = random(vrotais.count)
  end if
  prot = prot + vrotais[protais]
  if prot.x > 50 then
    prot.x = 50
    if random(4) = 1 then
      protais = random(vrotais.count)
    end if
  else
    if prot.x < 5 then
      prot.x = 5
      if random(40) = 1 then
        protais = random(vrotais.count)
      end if
    end if
  end if
  pgun.transform.rotation = prot
  pturret.transform.rotation.z = pgun.transform.rotation.z
end

on docams me
  pang = pang - 1
  pcam.transform.position = pmod.transform.position + vector(0, 0, 60 + (50 * sin(pang * 0.01))) + (angtovec(me, vector(0, 0, pang)) * 160)
  pcam.pointAt(pmod.transform.position + vector(0, 0, 5), vector(0, 0, 1))
  gmem.light("sun").transform.position = vector(0, 0, 0) + (angtovec(me, prot) * 10000)
end

on buildworld me
  repeat with i = 1 to gmem.model.count
    gmem.model[i].removeFromWorld()
  end repeat
  nmr = gmem.newModelResource("plane", #plane, #front)
  nmr.width = 30
  nmr.length = 30
  nmr2 = gmem.newModelResource("box", #box, #front)
  nmr2.width = 30
  nmr2.length = 1
  nmr2.height = 30
  vfloor = gmem.newModel("floor", nmr2)
  vfloor.transform.position = vector(0, 0, 0)
  vfloor.transform.scale = vector(1, 1, 1) * 15
  vfloor.visibility = #front
  vfloor.shaderList = shady("spawnstart")
  vfloor.shader.emissive = rgb(0, 0, 0)
  vfloor.shader.shininess = 0
  vfloor.shader.textureModeList[1] = #wrapPlanar
  vfloor.shader.textureModeList[2] = #wrapPlanar
  vfloor.shader.textureList[1] = texy("spawnstart")
  vfloor.shader.textureList[2] = texy("rad")
  vfloor.shader.blendSource = #constant
  vfloor.shader.blendFunctionList[2] = #multiply
  repeat with i = 1 to pweaplist.count
    vmod = gmem.newModel("icon" & pweaplist[i], nmr)
    member("icons").posterFrame = i
    ns = gmem.newShader("t" & pweaplist[i], #standard)
    ns.texture = gmem.newTexture("t" & pweaplist[i], #fromCastMember, member("icons"))
    ns.texture.renderFormat = #rgba8888
    vmod.shaderList = ns
    vmod.visibility = #both
    vmod.shader.emissive = rgb(255, 255, 255)
    vmod.transform.position = vector(0, 0, 20) + (angtovec(me, vector(0, 0, i * (360 / pweaplist.count))) * 200)
    vmod.pointAt(vector(0, 0, 0), vector(0, 0, 1))
  end repeat
  pmod = gmem.model("tank")
  pmod.addToWorld()
  vs = shady("tank_" & pteam)
  pmod.shaderList[1] = vs
  vs.shininess = 90
  pmod.shaderList[2] = gmem.shader("blackshine")
  gmem.shader("blackshine").shininess = 200
  pmod.transform.position = vector(0, 0, 200)
  bsp = pmod.boundingSphere[2]
  pphysx = member("physx")
  if pphysx.IsInitialized then
    pphysx.destroy()
  end if
  pphysx.init(gmem, vector(1, 1, 1), #equal, 1, 15)
  pphysx.gravity = vector(0.0, 0.0, -1)
  pphysx.contactTolerance = 0.10000000000000001
  pphysx.friction = 0
  pphysx.restitution = 0.10000000000000001
  vlandsc = make_rb(me, vfloor, #concaveshape, #static)
  vlandsc.friction = 1
  vlandsc.restitution = 0.01
  pdummy = make_rb(me, pmod, #convexshape, #dynamic)
  pdummy.friction = 1
  pdummy.mass = 160
  parts = ["wfl", "wfr", "wbl", "wbr"]
  vside = 22
  vforbac = 22
  vhig = -15
  oset = [vector(-vside, vforbac + 3, vhig), vector(vside, vforbac + 3, vhig), vector(-vside, -vforbac + 3, vhig), vector(vside, -vforbac + 3, vhig)]
  phavwheels = []
  vbeh = ["pwfl=", "pwfr=", "pwbl=", "pwbr="]
  repeat with i = 1 to parts.count
    gmem.model(parts[i]).addToWorld()
    partmod = gmem.model(parts[i])
    if i = 3 then
      pbackwheel = partmod
    end if
    partmod.shaderList = shady("wheels")
    partmod.transform.position = pmod.transform.position + oset[i]
    partmod.transform.scale = vector(1, 1, 1) * 1.69999999999999996
    qwe = make_rb(me, partmod, #convexshape, #dynamic)
    qwe.friction = 0.40000000000000002
    qwe.mass = 40
    qwe.restitution = 0
    addsus(me, qwe, pdummy, partmod.name, oset[i], vector(0, 0, 0))
    phavwheels.add(qwe)
  end repeat
  pwfl = phavwheels[1]
  pwfr = phavwheels[2]
  pwbl = phavwheels[3]
  pwbr = phavwheels[4]
  pdummy.centerOfMass = vector(0, -0.5, -14)
  pdummy.linearVelocity = vector(0, 0, 0)
  pphysx.EnableCollision(pdummy)
  repeat with i = 1 to phavwheels.count
    pphysx.EnableCollision(phavwheels[i])
    pphysx.DisableCollision(pdummy, phavwheels[i])
  end repeat
  pturret = gmem.newModel(string("turretturret"), gmem.model("turret").resource)
  vs = shady("turret")
  pturret.shaderList = vs
  vs.shininess = 90
  pturret.transform.position = vector(0, 0, 13)
  pturret.parent = pmod
  pgun = gmem.newModel(string("mgungun"), gmem.model("mgun").resource)
  vs = shady("mgun")
  pgun.shaderList = vs
  vs.shininess = 90
  pgun.transform.position = pturret.transform.position
  pgun.parent = pmod
  pgun.pointAtOrientation = [vector(0.0, 1.0, 0.0), vector(0.0, 0.0, 1.0)]
  pback = gmem.newModel(string("speedback"), gmem.model("speed").resource)
  pback.transform.position = vector(0, 0, 0)
  vs = shady(string(pteam) & "speed")
  pback.shaderList = vs
  vs.shininess = 90
  pback.parent = pmod
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

on angtovec me, rotsend
  modo = gmem.model[1]
  wtf = modo.getWorldTransform()
  wtf.scale = vector(1, 1, 1)
  wtf.position = vector(0, 0, 0)
  wtf.rotation = rotsend
  vnormal = wtf * vector(0, 1, 0)
  return vnormal
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
