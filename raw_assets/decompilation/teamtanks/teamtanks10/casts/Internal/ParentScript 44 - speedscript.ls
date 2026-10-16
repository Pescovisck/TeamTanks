property pActive
global goody

on new me
  pActive = 0
  (the actorList).add(me)
  return me
end

on stepFrame me
  if the mouseDown or the controlDown then
    if pActive = 0 then
      sound(8).play([#member: member("respeed"), #rateShift: 1])
      pActive = 1
    end if
    goody.pspeedo = 1
  else
    sound(8).stop()
    goody.pspeedo = 0
    pActive = 0
  end if
  if (goody.pweapon <> #speed) or (goody.pstate = "repos") or (goody.pstate = "end") then
    die(me)
  end if
end

on die me
  sound(8).stop()
  goody.pspeedo = 0
  goody.weaponry.pSpeed = VOID
  (the actorList).deleteOne(me)
end
