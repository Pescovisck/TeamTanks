property pmod, pos, weap, bangtime, ptyp
global gmem, goody, gplayers, gsmokes, gmodinc, gbanglight

on new me, nwho, ntyp
  if voidp(goody) then
    exit
  end if
  if nwho = goody.weaponry then
    vmodo = goody.pgun
  else
    vmodo = nwho.pgun
  end if
  vtypes = [#mgun, #mgunx2, #lasergun]
  vmods = [#mfmgun, #mfmgunx2, #mflasergun]
  vshads = ["mfmachinegun", "mfmachinegun", "mflaser"]
  vems = [rgb(255, 255, 255), rgb(255, 255, 255), rgb(25, 255, 25)]
  ptyp = ntyp
  vtyp = vtypes.getOne(ptyp)
  if vtyp <> 0 then
    pmod = recyclemodel(vmods[vtyp])
    if pmod = 0 then
      gmodinc = gmodinc + 1
      pmod = gmem.model(string(vmods[vtyp])).clone(string(vmods[vtyp]) & gmodinc)
    end if
    pmod.shaderList = shady(vshads[vtyp])
    pmod.shader.emissive = vems[vtyp]
    if voidp(gbanglight) then
      script("banglight").new(vmodo.getWorldTransform().position, vems[vtyp], 2)
    else
      gbanglight.lightup(vmodo.getWorldTransform().position, vems[vtyp], 5)
    end if
  else
    pmod = recyclemodel(#mfmgun)
  end if
  pmod.shader.blend = 100
  pmod.visibility = #both
  pmod.transform.position = vmodo.getWorldTransform().position
  pmod.transform.rotation = vmodo.getWorldTransform().rotation
  bangtime = 1
  pmod.parent = gsmokes
  (the actorList).add(me)
  return me
end

on stepFrame me
  pmod.addToWorld()
  if bangtime = 0 then
    vtypes = [#mgun, #mgunx2, #lasergun]
    vmods = [#mfmgun, #mfmgunx2, #mflasergun]
    vtyp = vtypes.getOne(ptyp)
    storemodel(vmods[vtyp], pmod)
    (the actorList).deleteOne(me)
  end if
  bangtime = bangtime - 1
end

on hurt me
end
