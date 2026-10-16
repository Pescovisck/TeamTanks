property pmod, pActive, pactivetick
global gmem, goody

on new me, npos
  pActive = 0
  pactivetick = 10
  goody.pback.shader = shady(string(goody.pteam) & "stealth", 1)
  makenormal(me)
  (the actorList).add(me)
  return me
end

on stepFrame me
  if the mouseDown or the controlDown then
    if pactivetick > 0 then
      if pactivetick = 7 then
        sound(8).play([#member: member("restealth"), #rateShift: 1])
      end if
      makestealth(me)
      pActive = 1
      pactivetick = pactivetick - 1
    end if
  else
    pActive = 0
    if pactivetick < 10 then
      makenormal(me)
      sound(8).stop()
    end if
    pactivetick = 10
  end if
  if (goody.pweapon <> #stealth) or (goody.pstate = "repos") or (goody.pstate = "end") then
    die(me)
  end if
end

on makenormal me
  pActive = 0
  vs = goody.ptankshad
  vs.blend = 100
  goody.pmod.shaderList[1] = vs
  vs = gmem.shader("blackshine")
  vs.blend = 100
  goody.pmod.shaderList[2] = vs
  if goody.pweapon = #stealth then
    vs = shady(string(goody.pteam) & "stealth", 1)
    vs.blend = 100
    goody.pback.shader = vs
  else
    goody.pback.shader.blend = 100
  end if
  repeat with i = 1 to goody.phavwheels.count
    gmem.model(goody.phavwheels[i].name).shaderList = shady("wheels")
    gmem.model(goody.phavwheels[i].name).shader.blend = 100
  end repeat
  script("stealthsparkle").new(goody.pos)
end

on makestealth me
  pshad = shady("white")
  pshad.emissive = rgb(255, 255, 255)
  pshad.blend = 20
  goody.pmod.shaderList = pshad
  goody.pback.shaderList = pshad
  repeat with i = 1 to goody.phavwheels.count
    gmem.model(goody.phavwheels[i].name).shaderList = pshad
  end repeat
  script("stealthsparkle").new(goody.pos)
end

on die me
  makenormal(me)
  goody.weaponry.pstealth = VOID
  (the actorList).deleteOne(me)
end
