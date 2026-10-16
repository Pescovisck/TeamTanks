property pmod, pname, pteam, pid, pTarget, prot, pdropzone, ptarpos, psteps, pdrops
global gmem, goody, gsmokes, gmodinc, gmaxheight

on new me, ntarpos, ngunrot, nnom, nteam, nid
  pmod = recyclemodel(#airship)
  if pmod = 0 then
    gmodinc = gmodinc + 1
    pmod = gmem.model("airship").clone("airship" & gmodinc)
  end if
  pteam = nteam
  pid = nid
  pname = nnom
  pmod.visibility = #front
  pmod.shaderList = shady(pteam & "airship")
  vhi = gmaxheight + (random(200) + 200)
  pdropzone = ntarpos + vector(0, 0, vhi)
  vang = -ngunrot.z
  vrad = 5000
  pmod.transform.position = pdropzone + (angtovec(vector(0, 0, vang)) * vrad)
  ptarpos = pdropzone + (angtovec(vector(0, 0, vang + 180)) * vrad)
  vdel = pdropzone - pmod.transform.position
  vang = vectoang(vdel)
  pmod.transform.rotation = vector(0, 0, -vang.z)
  pmod.transform.scale = vector(1, 1, 1) * 0.01
  psteps = 300
  if (ngunrot.z > 90) and (ngunrot.z < 180) then
    pdrops = [integer(psteps * 0.5) + 0, integer(psteps * 0.5) + 15, integer(psteps * 0.5) - 15]
  else
    if (ngunrot.z < 90) and (ngunrot.z > 0) then
      pdrops = [integer(psteps * 0.5) + 0, integer(psteps * 0.5) + 20, integer(psteps * 0.5) - 10]
    else
      if (ngunrot.z < 0) and (ngunrot.z > -90) then
        pdrops = [integer(psteps * 0.5) + 0, integer(psteps * 0.5) + 10, integer(psteps * 0.5) - 20]
      else
        if (ngunrot.z < -90) and (ngunrot.z > -180) then
          pdrops = [integer(psteps * 0.5) + 10, integer(psteps * 0.5) + 14, integer(psteps * 0.5) - 14]
        end if
      end if
    end if
  end if
  playsound(pmod.transform.position, "airraidsiren", 7)
  (the actorList).add(me)
  return me
end

on stepFrame me
  if psteps > 1 then
    if psteps > 270 then
      pmod.transform.scale = pmod.transform.scale * 1.19999999999999996
    else
      if psteps < 30 then
        pmod.transform.scale = pmod.transform.scale * 0.80000000000000004
      end if
    end if
    if pdrops.getOne(psteps) then
      if not voidp(goody) then
        airbomb = script("airbombs").new(pmod.transform.position, pname, pteam, pid)
      end if
    end if
    vwav = vector(0, 0, sin(psteps / 4) * 1)
    vspeed = (ptarpos - pmod.transform.position) / psteps
    psteps = psteps - 1
    pmod.transform.position = pmod.transform.position + vspeed + vwav
  else
    die(me)
  end if
end

on die me
  storemodel(#airship, pmod)
  if pname = goody.pname then
    gmem.model("airstriketarget").visibility = #none
    goody.weaponry.pairstrike = VOID
  end if
  (the actorList).deleteOne(me)
end
