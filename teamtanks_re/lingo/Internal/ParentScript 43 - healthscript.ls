property pos, pmod, plives, pid, psender
global gmem, goody, gmodinc, gsmokes

on new me, npos, nrot, nid, nsend
  if voidp(nsend) then
    psender = EMPTY
  else
    psender = nsend
  end if
  pid = nid
  pos = npos
  rot = nrot
  playsound(pos, "reminedrop", 7)
  pos = pos - (angtovec(nrot) * goody.bsp * 2)
  plives = 1500
  pmod = recyclemodel(#health)
  if pmod = 0 then
    gmodinc = gmodinc + 1
    pmod = gmem.model("health").clone("health" & gmodinc)
    pmod.removeFromWorld()
  end if
  pmod.transform.scale = vector(1, 1, 1) * 0.5
  ray = gmem.modelsUnderRay(pos, vector(0.01, 0, -0.98999999999999999), 1, #detailed)
  if ray <> [] then
    pos = ray[1].isectPosition
    rot = ray[1].isectNormal
  end if
  pmod.shaderList = shady("tboxhealth")
  pmod.transform.position = pos + rot
  pmod.pointAt(pos)
  pmod.parent = gsmokes
  (the actorList).add(me)
  return me
end

on distboy me
  if goody.pos.distanceTo(pos) < (goody.bsp * 1.60000000000000009) then
    if psender <> EMPTY then
      goody.feedback(psender & "'s  repair pack")
    end if
    goody.poldlives = 100
    goody.plives = 102
    goody.pcheatflick = 2
    detonate(me)
  end if
end

on stepFrame me
  if not voidp(goody) then
    if goody.pstate = "end" then
      die(me)
    end if
    plives = plives - 1
    if plives = 0 then
      detonate(me)
    end if
    if plives < 1450 then
      distboy(me)
    end if
  end if
end

on detonate me
  playsound(pos, "repickup", 7)
  submitmus([#subject: "detonate", #content: [#pid: pid]])
  die(me)
end

on die me
  vget = goody.phealthlist.getOne(me)
  if vget <> 0 then
    goody.phealthlist.deleteAt(vget)
  end if
  storemodel(#health, pmod)
  (the actorList).deleteOne(me)
end
