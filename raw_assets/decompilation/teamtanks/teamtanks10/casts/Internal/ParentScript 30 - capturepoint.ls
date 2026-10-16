property pmod, pglow, poldglow, pglowmod, ptarglow, ptype, pmussteps, plight, povtex, pcapchange, pcatching, pcaught, poldframe
global gmem, gteam, gcappoints, goody, gsmokes, gmodinc

on new me, nmod, nteam
  resetglows(me)
  pmod = nmod
  pmussteps = 15
  pmod.addToWorld()
  pmod.shaderList[3] = gmem.newShader("glowbase" & nmod.name, #standard)
  pmod.shaderList[3].emissive = rgb(pglow[1], pglow[2], pglow[3])
  pmod.shaderList[3].shininess = 0
  pmod.shaderList[3].texture = texy("white")
  pos = pmod.transform.position
  gmodinc = gmodinc + 1
  pglowmod = gmem.model("glow").clone("glow" & gmodinc)
  pglowmod.shaderList = gmem.newShader("glow" & nmod.name, #standard)
  pglowmod.shaderList.texture = texy("glow", 1)
  pglowmod.shaderList.emissive = rgb(pglow[1], pglow[2], pglow[3])
  pglowmod.shaderList.specular = rgb(0, 0, 0)
  pglowmod.shaderList.shininess = 0
  pglowmod.transform.position = pmod.transform.position
  pglowmod.visibility = #both
  pglowmod.parent = gsmokes
  pglowmod.shader.texture.nearFiltering = 1
  pglowmod.shader.texture.renderFormat = #rgba8888
  pglowmod.shader.blend = 100
  plight = gmem.newLight("light" & pmod.name, #point)
  plight.transform.position = pmod.transform.position + vector(0, 0, 300)
  plight.attenuation = vector(0, 0.004, 0)
  pcapchange = []
  pcatching = 0
  pcaught = 0
  poldframe = 50
  (the actorList).add(me)
  return me
end

on stepFrame me
  pglowmod.shader.textureTransform.position.y = pglowmod.shader.textureTransform.position.y + 0.01
  pglowmod.shader.textureTransform.position.x = random(10) * 0.10000000000000001
  if checkgoody() then
    if goody.pos.distanceTo(pmod.transform.position) < (goody.bsp * 9) then
      goody.pcapture = 1
      pcatching = 1
      pcapchange = [2, gcappoints.getOne(me)]
    else
      pcapchange = []
      pcatching = 0
    end if
  end if
  doglows(me)
end

on doglows me
  repeat with i = 1 to pglow.count
    pglow[i] = pglow[i] + ((ptarglow[i] - pglow[i]) * 0.03)
  end repeat
  vglow = rgb(integer(pglow[1]), integer(pglow[2]), integer(pglow[3]))
  plight.color = rgb(integer(pglow[1]), integer(pglow[2]), integer(pglow[3]))
  pmod.shaderList[3].emissive = vglow
  pglowmod.shaderList.emissive = vglow
  if integer(poldglow[3] / 2.5) <> integer(ptarglow[3] / 2.5) then
    poldglow = ptarglow
    img = member("cp_red").image.duplicate()
    img.copyPixels(member("cp_blue").image, rect(0, 0, 0.63 * integer(ptarglow[3] / 2.5), 127), rect(0, 0, 0.63 * integer(ptarglow[3] / 2.5), 127), [#useFastQuads: 1])
    member("cp").image = img
    if not voidp(povtex) then
      povtex.member = member("cp")
    end if
  end if
end

on pushglows me, nteam, nval
  pteams = EMPTY
  if string(nteam) = "red" then
    ppushglow = [nval, 0, -nval]
  else
    ppushglow = [-nval, 0, nval]
  end if
  ptarglow = ptarglow + ppushglow
  repeat with i = 1 to ptarglow.count
    if ptarglow[i] > 255 then
      ptarglow[i] = 255
      next repeat
    end if
    if ptarglow[i] < 0 then
      ptarglow[i] = 0
    end if
  end repeat
  if (nteam = goody.pteam) and (pcatching = 1) then
    if (integer(ptarglow[3] / 2.5) = 1) or (integer(ptarglow[3] / 2.5) = 100) then
      if pcaught = 0 then
        goody.pstats.pcaptures = goody.pstats.pcaptures + 1
        pcaught = 1
      end if
    else
      pcaught = 0
    end if
    if poldframe <> integer(ptarglow[3] / 2.5) then
      script("ingamefeedback").new(goody.pos, "*2*", 1)
      goody.setscore(integer(2))
      poldframe = integer(ptarglow[3] / 2.5)
    end if
  end if
end

on updateglows me, vsend
  submitone(vsend, [#subject: "capupdate", #content: [#glow: ptarglow, #id: gcappoints.getOne(me)]])
end

on resetglows me
  poldglow = [300, 300, 300]
  pglow = [127, 0, 127]
  ptarglow = pglow
end

on die me
  Remove(me)
end

on Remove me
  (the actorList).deleteOne(me)
end
