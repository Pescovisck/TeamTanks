property pmod, bangtime, pname
global gmem, goody, gsmokes, gbanglight

on new me, npos, typ, nam
  pname = nam
  vpos = npos
  pmod = planemakeme()
  pmod.transform.position = vpos
  vtypes = ["laser", "cannon"]
  vshads = ["laser", "cannon"]
  vcullers = [rgb(255, 0, 0), rgb(0, 255, 25)]
  vems = [rgb(255, 25, 255), rgb(25, 255, 25)]
  vscales = [vector(2, 2, 2), vector(4, 4, 4)]
  vtyp = vtypes.getOne(typ)
  if vtyp <> 0 then
    pmod.transform.scale = vscales[vtyp]
    pmod.shaderList = shady(vshads[vtyp])
    pmod.shader.emissive = vems[vtyp]
    if voidp(gbanglight) then
      script("banglight").new(vpos, vcullers[vtyp])
    else
      gbanglight.lightup(vpos, vcullers[vtyp])
    end if
  end if
  pmod.shader.texture.nearFiltering = 1
  pmod.shader.texture.renderFormat = #rgba8888
  pmod.shader.blend = 50
  pmod.pointAt(goody.pcam, getnormal(goody.pmod, vector(0, 0, 1)))
  pmod.rotate(vector(0, 0, random(360)), #self)
  bangtime = 8
  pmod.parent = gsmokes
  (the actorList).add(me)
  return me
end

on stepFrame me
  if checkgoody() then
    pmod.addToWorld()
    bangtime = bangtime - 1
    if bangtime = 0 then
      storemodel(#plane, pmod)
      (the actorList).deleteOne(me)
    end if
  end if
end

on hurt me
end
