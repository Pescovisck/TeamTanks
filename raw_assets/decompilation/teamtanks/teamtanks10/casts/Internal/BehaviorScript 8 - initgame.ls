property pcontent, mazwid, pdelcontent
global gmem, ghvk, goody, nom, gsmokes, gteam, gcappoints, glevel, gmusmode, gredspawnpos, gbluespawnpos, gmaxheight, gshadows

on beginSprite me
  member("progress").text = EMPTY
  updateprogress("Building level", 1)
  resetactors()
  gmem = member("3d")
  gmem.resetWorld()
  pdelcontent = []
  repeat with i = 1 to gmem.model.count
    pdelcontent.add(gmem.model[i])
  end repeat
  repeat with i = 1 to gmem.model("spawn").shaderList.count
    if gmem.model("spawn").shaderList[i].name <> "spawnteam" then
      gmem.model("spawn").shaderList[i] = shady(gmem.model("spawn").shaderList[i].name)
    end if
  end repeat
  gmem.model("spawn").transform.scale = vector(1, 1, 1) * 0.59999999999999998
  repeat with i = 1 to gmem.model("capturepoint").shaderList.count
    if gmem.model("capturepoint").shaderList[i].name <> "baseglow" then
      gmem.model("capturepoint").shaderList[i] = shady(gmem.model("capturepoint").shaderList[i].name)
    end if
  end repeat
  repeat with i = 1 to gmem.light.count
    gmem.deleteLight(i)
  end repeat
  l = gmem.newLight("sun", #point)
  l.transform.position = vector(0, 0, 10000)
  l.color = rgb(230, 230, 230)
  gsmokes = gmem.newGroup("smokes")
  gshadows = []
  gmaxheight = 0
  genlevel(me)
  sortskybox(me)
  sortphysbox(me)
  repeat with i = 1 to pdelcontent.count
    gmem.model(pdelcontent[i].name).removeFromWorld()
  end repeat
  repeat with i = 1 to pcontent.count
    gmem.deleteModel(pcontent[i])
  end repeat
  if (glevel.name & glevel.level) = "grass1" then
    gmem.model("ground whitebrick1").addToWorld()
    gmem.model("ground whitebrick1").transform.scale = vector(1, 1, 0.59999999999999998) * 1.30000000000000004
    gmem.model("ground whitebrick1").transform.position = vector(0, 0, 220)
    gmem.model("ground whitebrick1").shader.texture = texy("brick")
    gmem.model("ground whitebrick1").shader.emissive = rgb(70, 70, 70)
    gshadows.add(gmem.model("ground whitebrick1"))
  else
    gmem.deleteModel("ground whitebrick1")
  end if
  updateprogress("Initialising Agiea (TM) physics engine...", 1)
  ghvk = script("ageia").new()
  updateprogress("TeamTanks loaded", 1)
  gmem.directToStage = 0
  sprite(me.spriteNum).locV = 300
  gmem.directToStage = 1
  updateStage()
  script("teambalance").new()
  script("goody").new()
  gmusmode = "game"
end

on genlevel me
  unit = glevel.size
  gredspawnpos = []
  gbluespawnpos = []
  toverts = []
  tofaces = []
  touvs = []
  img = member(glevel.name & glevel.level)
  wid = img.image.width
  mazwid = unit * (wid - 1)
  mazhi = float(unit * glevel.height)
  pcontent = ["pickup", "ramp1", "ramp2", "ramp3", "loop", "twist", "spawn", "capturepoint"]
  vgrncols = [191, 100, 110, 120, 130, 140, 200, 250]
  vpicklist = ["mgun", "bgun", "nook", "rocket", "proximitymine", "speed", "lasergun", "mgunx2", "rocketx4", "remotemine", "sonicgun", "guidedmissile", "thrusters", "mortar", "airstrike", "rcbomb", "rcrocket", "health", "stealth"]
  vpowerupscols = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190]
  vlocked = []
  vweaplist = ["mgun", "bgun", "nook", "rocket", "proximitymine", "speed"]
  if member("dataweapons").text <> EMPTY then
    vnom = member("dataweapons").text
    the itemDelimiter = ";"
    vbits = []
    repeat with i = 2 to vnom.item.count
      vbits.add(vnom.item[i])
    end repeat
    the itemDelimiter = ":"
    repeat with i = 1 to vbits.count
      vvnom = vbits[i]
      vweaplist.add(vvnom.item[1])
    end repeat
  end if
  if member("datacal").text <> EMPTY then
    vallpremweaps = ["lasergun", "mgunx2", "rocketx4", "remotemine", "sonicgun", "guidedmissile", "thrusters", "mortar", "airstrike", "rcbomb", "rcrocket", "health", "stealth"]
    vnom = member("datacal").text
    the itemDelimiter = ";"
    vday = integer(vnom.item[3])
    vnum = vday mod 13
    if vnum = 0 then
      vnum = 13
    end if
    vpremiere = vallpremweaps[vnum]
  else
    vpremiere = EMPTY
  end if
  vallweaps = ["mgun", "bgun", "nook", "rocket", "proximitymine", "speed", "lasergun", "mgunx2", "rocketx4", "remotemine", "sonicgun", "guidedmissile", "thrusters", "mortar", "airstrike", "rcbomb", "rcrocket", "health", "stealth", "blank"]
  repeat with i = 1 to vallweaps.count
    if vweaplist.getOne(vallweaps[i]) or (vallweaps[i] = vpremiere) then
      vlocked.add(1)
      next repeat
    end if
    vlocked.add(0)
  end repeat
  gcappoints = []
  repeat with i = 0 to wid - 1
    repeat with v = 0 to wid - 1
      t = t + 1
      if t > 100 then
        updateprogress(".", 0)
        t = 1
      end if
      mycolor = member(glevel.name & glevel.level).image.getPixel(i, v)
      keptvector = vector((i * unit) - (mazwid * 0.5), (v * unit) - (mazwid * 0.5), mycolor.red * mazhi)
      if gmaxheight < (mycolor.red * mazhi) then
        gmaxheight = mycolor.red * mazhi
      end if
      toverts.add(keptvector)
      if mycolor.green = 191 then
        vColor = member(glevel.name & glevel.level & "powerups").image.getPixel(i, v)
        if vColor.red > 0 then
          pu = vpowerupscols.getOne(vColor.red)
          if pu <> 0 then
            vpick = vpicklist[pu]
            pickup = script("pickups").new(keptvector + vector(0, 0, 30), vector(0, 0, 0), vpick & "_" & v, vpick, vlocked[pu], pcontent[vgrncols.getOne(191)])
          end if
        end if
      end if
      if (mycolor.green > 0) and (mycolor.green <> 191) then
        ars = vgrncols.getOne(mycolor.green)
        if ars <> 0 then
          vmod = gmem.model(pcontent[ars])
          po = vmod.clone(vmod.name & i & "_" & v)
          po.transform.position = keptvector + vector(0, 0, -5)
          po.transform.rotation = vector(0, 0, (mycolor.blue * 10) - 100)
          gshadows.add(po)
          if ars <= 4 then
            po.shaderList = shady("rampboard")
          end if
          if mycolor.green < 190 then
            vColor = member(glevel.name & glevel.level & "powerups").image.getPixel(i, v)
            if vColor.red > 0 then
              pu = vpowerupscols.getOne(vColor.red)
              if pu <> 0 then
                vpick = vpicklist[pu]
                pickup = script("pickups").new(po.transform.position, po.transform.rotation, vpick & "_" & v, vpick, vlocked[pu], pcontent[ars])
              end if
            end if
            next repeat
          end if
          if mycolor.green = 200 then
            vvcolor = member(glevel.name & glevel.level & "powerups").image.getPixel(i, v)
            po.shaderList[1] = gmem.newShader("spawnteam" & po.name, #standard)
            if vvcolor = rgb(255, 0, 0) then
              gredspawnpos.add(po.name)
              po.shaderList[1].texture = texy("red")
            else
              if vvcolor = rgb(0, 0, 255) then
                gbluespawnpos.add(po.name)
                po.shaderList[1].texture = texy("blue")
              end if
            end if
            po.shaderList[1].shininess = 0
            po.shaderList[1].emissive = vvcolor
            next repeat
          end if
          if mycolor.green = 250 then
            gcappoints.add(script("capturepoint").new(po))
          end if
        end if
      end if
    end repeat
  end repeat
  repeat with i = 1 to wid - 1
    repeat with v = 0 to wid - 2
      tl = i + (v * wid)
      tr = i + (v * wid) + 1
      bl = i + (v * wid) + wid
      br = i + (v * wid) + wid + 1
      tofaces.add([tr, tl, bl])
      touvs.add([1, 2, 4])
      tofaces.add([tr, bl, br])
      touvs.add([1, 4, 3])
    end repeat
  end repeat
  nm = gmem.newMesh("ground", tofaces.count, toverts.count, 0, 1, 4)
  repeat with i = 1 to tofaces.count
    nm.face[i].vertices = tofaces[i]
    nm.face[i].textureCoordinates = touvs[i]
  end repeat
  nm.colorList = [rgb(255, 255, 255)]
  nm.vertexList = toverts
  nm.textureCoordinateList = [[0, 0], [0, 1], [1, 0], [1, 1]]
  nm.generateNormals(#smooth)
  nm.build()
  nm = gmem.newModel("ground", nm)
  gshadows.add(nm)
  nm.addModifier(#meshDeform)
  nm.shaderList = shady(glevel.name & glevel.level & "tex")
  nmsh = gmem.shader(glevel.name & glevel.level & "tex")
  nmsh.texture.nearFiltering = 1
  nmsh.textureList[2] = texy(glevel.tiletex, 1)
  nmsh.textureModeList[1] = #wrapPlanar
  nmsh.textureTransformList[1].rotation = vector(0, 180, 180)
  nmsh.textureTransformList[1].scale = vector(1.01000000000000001, 1.01000000000000001, 1.01000000000000001)
  nmsh.blendSource = #constant
  if (glevel.name = "artic") or (glevel.name = "specialops") then
    nmsh.blendFunctionList[2] = #add
  else
    nmsh.blendFunctionList[2] = #multiply
  end if
  nmsh.blendConstantList[2] = 40
end

on sortskybox me
  rad = mazwid * 1.19999999999999996
  sky = gmem.newModelResource("sky", #cylinder, #back)
  sky.topRadius = rad
  sky.bottomRadius = rad
  sky.height = rad * 0.69999999999999996
  sky.bottomCap = 0
  sky = gmem.newModel("sky", sky)
  sky.transform.position = vector(0, 0, 0)
  sky.transform.rotation = vector(90, 0, 0)
  sk = shady("sky" & glevel.name)
  sky.shaderList[1] = sk
  qwe = member("sky" & glevel.name).image.getPixel(0, 0)
  member("gimp").image.setPixel(0, 0, qwe)
  sky.shaderList[2] = gmem.newShader("skytop", #standard)
  sky.shaderList[2].texture = gmem.newTexture("skytop", #fromCastMember, member("gimp"))
  gmem.bgColor = member("sky" & glevel.name).image.getPixel(0, 255)
  repeat with i = 1 to sky.shaderList.count
    sk = sky.shaderList[i]
    sk.texture.nearFiltering = 1
    sk.texture.quality = #low
    sk.texture.renderFormat = #rgba8888
    sk.textureTransform.scale = vector(0.20000000000000001, 1.01000000000000001, 1.01000000000000001)
    sk.emissive = rgb(255, 255, 255)
  end repeat
  sky.parent = gsmokes
end

on sortphysbox me
  rad = mazwid * 0.98999999999999999
  pb = gmem.newModelResource("physbox", #box, #both)
  pb.height = rad
  pb.length = rad
  pb.width = rad
  pb = gmem.newModel("physbox", pb)
  pb.transform.position = vector(0, 0, 0)
end
