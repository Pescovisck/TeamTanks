property pmod, pthruster, ptype, hit, plifetime, pname, pteam, pmussteps, poldmloc, phangtime, pos, rot, tarpos, tarrot, pSpeed, pActive, pparent, pid
global gmem, gsmokes, goody, gmodinc

on new me, npos, nrot, nam, nteam, ntype, nparent
  pteam = nteam
  pname = nam
  pparent = nparent
  hit = 0
  rot = nrot
  pos = npos
  plifetime = 1000
  pmussteps = 0
  pSpeed = vector(0, 0, 0)
  tarrot = rot
  tarpos = pos
  ptype = string(ntype)
  pActive = 1
  pid = pname & ptype
  if ptype = "rcrocket" then
    pmod = recyclemodel(#rcrocket)
    if pmod = 0 then
      gmodinc = gmodinc + 1
      pmod = gmem.model("rcrocket").clone("rcrocket" & gmodinc)
    end if
    pmod.shaderList = shady(pteam & "rcrocket")
  else
    pmod = recyclemodel(#rcbomb)
    if pmod = 0 then
      gmodinc = gmodinc + 1
      pmod = gmem.model("rcbomb").clone("rcbomb" & gmodinc)
    end if
    pmod.transform.scale = vector(1, 1, 1) * 2
    pmod.shaderList = shady(pteam & "rcbomb")
  end if
  pmod.addToWorld()
  pmod.transform.position = pos
  pmod.transform.rotation = rot
  pmod.parent = gsmokes
  (the actorList).add(me)
  return me
end

on stepFrame me
  if not voidp(goody) then
    pmussteps = pmussteps - 1
    if pmussteps > 0 then
      pSpeed = (tarpos - pos) / pmussteps
      torq = rotinterp(rot, tarrot, pmussteps)
      pos = pos + pSpeed
      rot = rot + torq
    else
      pos = tarpos
      rot = tarrot
      pSpeed = vector(0, 0, 0)
      if pmussteps = -450 then
        detonate(me)
      end if
    end if
    pmod.transform.position = pos
    pmod.transform.rotation = rot
    plifetime = plifetime - 1
    if ptype = "rcrocket" then
      script("puff").new(pos, "rcrocket")
    end if
    if goody.pstate = "end" then
      detonate(me)
    end if
  end if
end

on newstuff me, ndata
  pmussteps = 16
  vdata = value(ndata)
  tarpos = vdata[1]
  tarrot = vdata[2]
end

on detonate me
  bang = script("bangs").new(pos, ptype, pname)
  if ptype = "rcrocket" then
    storemodel(#rcrocket, pmod)
  else
    storemodel(#rcbomb, pmod)
  end if
  pparent.premote = VOID
  (the actorList).deleteOne(me)
end
