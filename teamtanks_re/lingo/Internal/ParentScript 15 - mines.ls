property pos, pmod, plives, pname, pid, pteam, ptyp, premoteboom
global gmem, goody, gmodinc, gplayers, gsmokes

on new me, npos, nrot, nam, nteam, nid, ntyp
  pteam = nteam
  (the actorList).add(me)
  pid = nid
  pname = nam
  ptyp = ntyp
  pos = npos
  rot = nrot
  playsound(pos, "reminedrop", 7)
  pos = pos - (angtovec(nrot) * goody.bsp * 2)
  plives = 1500
  premoteboom = 0
  if ptyp = "proximity" then
    pmod = recyclemodel(#proximitymine)
    if pmod = 0 then
      gmodinc = gmodinc + 1
      pmod = gmem.model("proximitymine").clone("proximitymine" & gmodinc)
      pmod.transform.scale = vector(1, 1, 1)
      pmod.removeFromWorld()
    end if
  else
    if ptyp = "remote" then
      pmod = recyclemodel(#remotemine)
      if pmod = 0 then
        gmodinc = gmodinc + 1
        pmod = gmem.model("remotemine").clone("remotemine" & gmodinc)
        pmod.transform.scale = vector(1, 1, 1)
        pmod.removeFromWorld()
      end if
    end if
  end if
  ray = gmem.modelsUnderRay(pos, vector(0.01, 0, -0.98999999999999999), 1, #detailed)
  if ray <> [] then
    pos = ray[1].isectPosition
    rot = ray[1].isectNormal
  end if
  pmod.shaderList = shady(pteam & "mines")
  pmod.transform.position = pos + rot
  pmod.pointAt(pos)
  pmod.parent = gsmokes
  return me
end

on distboy me
  if goody.pos.distanceTo(pos) < (goody.bsp * 1.60000000000000009) then
    detonate(me)
  end if
end

on stepFrame me
  if not voidp(goody) then
    if goody.pstate = "end" then
      die(me)
    end if
    plives = plives - 1
    if pname = goody.pname then
      if plives = 0 then
        detonate(me)
      end if
    end if
    if plives = 1450 then
    else
      if plives < 1450 then
        if ptyp = "proximity" then
          distboy(me)
        else
          if ptyp = "remote" then
            if the controlDown then
              premoteboom = premoteboom + 1
            else
              premoteboom = 0
            end if
            if (the rightMouseDown or (premoteboom > 10)) and (goody.pname = pname) then
              detonate(me)
            end if
          end if
        end if
      end if
    end if
  end if
end

on detonate me
  submitmus([#subject: "detonate", #content: [#pid: pid]])
  bang = script("bangs").new(pos, ptyp & "mine", pname)
  plifetime = 0
  die(me)
end

on die me
  if ptyp = "proximity" then
    vget = goody.pminelist.proximity.getOne(me)
    if vget <> 0 then
      goody.pminelist.proximity.deleteAt(vget)
    end if
    storemodel(#proximitymine, pmod)
  else
    if ptyp = "remote" then
      vget = goody.pminelist.remote.getOne(me)
      if vget <> 0 then
        goody.pminelist.remote.deleteAt(vget)
      end if
      storemodel(#remotemine, pmod)
    end if
  end if
  vget = goody.pallmines.getOne(me)
  if vget <> 0 then
    goody.pallmines.deleteAt(vget)
  end if
  (the actorList).deleteOne(me)
end
