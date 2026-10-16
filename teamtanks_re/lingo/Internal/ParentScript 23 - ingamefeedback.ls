property pmod, pos, pinc, pspinner
global gmem, goody, gsmokes

on new me, npos, nstr, nobj
  pos = npos
  pmod = recyclemodel(#inplane)
  if pmod = 0 then
    pmod = planemake()
  end if
  pmod.visibility = #both
  if nstr.ilk = #member then
    pmod.shaderList[1] = shady(nstr.name)
    pspinner = 1
  else
    if member("feedback").text <> string(nstr) then
      member("feedback").text = string(nstr)
      if goody.psuper > 0 then
        member("feedback").color = rgb(250, 250, 10)
      else
        member("feedback").color = rgb(255, 255, 255)
      end if
    end if
    if voidp(gmem.shader("feedback")) then
      pmod.shaderList = shady("feedback")
      gmem.texture("feedback").nearFiltering = 0
      gmem.texture("feedback").renderFormat = #rgba8888
    else
      pmod.shaderList[1].texture.member = member("feedback")
    end if
    pspinner = 0
  end if
  pmod.shaderList[1].textureTransform.scale = vector(1, 1, 1)
  pmod.shader.emissive = rgb(255, 255, 255)
  pmod.shader.blend = 100
  pmod.transform.scale = vector(1, 1, 1) * 0.10000000000000001
  if nobj then
    pmod.transform.position = pos + vector(0, 0, goody.bsp * 0.29999999999999999)
  else
    pmod.transform.position = goody.pcam.transform.position + (angtovec(goody.pcam.transform.rotation) * 5)
  end if
  pinc = 100
  pmod.parent = gsmokes
  if not voidp(goody) then
    pmod.transform.rotation = goody.pcam.transform.rotation + vector(0, 0, 180)
  end if
  (the actorList).add(me)
  return me
end

on stepFrame me
  if not voidp(goody) then
    if not voidp(goody) then
      pinc = pinc - (2 + (pinc * 0.01))
      if pspinner = 0 then
        pmod.transform.rotation = goody.pcam.transform.rotation + vector(0, 0, 180)
        pmod.transform.scale = vector(1, 1, 1) * ((100 - pinc) * 0.03)
      else
        pmod.transform.rotation = pmod.transform.rotation + vector(0, 0, pinc)
        pmod.transform.scale = vector(1, 1, 1) * ((100 - pinc) * 0.03)
        pmod.transform.position = pmod.transform.position + vector(0, 0, 2)
      end if
    else
      pinc = pinc - (2 + (pinc * 0.01))
    end if
    pmod.shader.blend = integer(pinc)
    if pinc < 1 then
      hurt(me)
    end if
  else
    hurt(me)
  end if
end

on hurt me
  storemodel(#inplane, pmod)
  (the actorList).deleteOne(me)
  me = VOID
end
