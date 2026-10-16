property pmod, pteam, bangtime
global gmem, goody, gsmokes

on new me, nmod, nteam
  pmod = nmod
  pteam = nteam
  vshad = shady(string("supercharge" & pteam))
  vshad.emissive = rgb(255, 255, 255)
  pmod.shaderList = vshad
  bangtime = 200
  (the actorList).add(me)
  return me
end

on stepFrame me
  if bangtime = 0 then
    pmod.shaderList[1] = goody.ptankshad
    pmod.shaderList[2] = gmem.shader("blackshine")
    (the actorList).deleteOne(me)
  end if
  bangtime = bangtime - 1
end

on hurt me
end
