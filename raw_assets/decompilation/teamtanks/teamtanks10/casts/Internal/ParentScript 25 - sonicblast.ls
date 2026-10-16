property pos, pSpeed, pendpos, plifetime, puffin, pname, pid, pwhogotit
global gmem, goody

on new me, nspos, nepos, nam, nid, nteam
  pid = nid
  pname = nam
  pos = nspos
  pendpos = nepos
  pSpeed = pendpos - pos
  pSpeed.normalize()
  pSpeed = pSpeed * goody.bsp * 2.29999999999999982
  puffin = 1
  plifetime = 1000
  playsound(pos, "resonicblast", 7)
  (the actorList).add(me)
end

on stepFrame me
  if not checkgoody() then
    Remove(me)
  else
    plifetime = plifetime - 1
    puff(me, pos)
    pos = pos + pSpeed
    if pos.distanceTo(pendpos) < pSpeed.magnitude then
      pos = pendpos
      bang = script("bangs").new(pendpos, "sonicgun", pname)
      Remove(me)
    end if
    if plifetime < 0 then
      Remove(me)
    end if
  end if
end

on puff me, pos
  puffin = not puffin
  if puffin = 1 then
    puff = script("puff", "parents").new(pos, "impulse")
  end if
end

on Remove me
  (the actorList).deleteOne(me)
end
