property inc, vteams
global gmem, goody, gplayers, gteamok, gteambalancer

on new me, npos
  inc = 0
  gteamok = []
  vteams = [0, 0]
  (the actorList).add(me)
  gteambalancer = me
  member("rednos").text = "0"
  member("bluenos").text = "0"
  member("UI_trans").posterFrame = 1
  gmem.camera(1).addOverlay(texy("UI_trans", 0), point(0, 0), 0)
  gmem.camera(1).addOverlay(texy("rednos", 0), point(159, 325), 0)
  gmem.camera(1).addOverlay(texy("bluenos", 0), point(428, 316), 0)
  gmem.texture("UI_trans").nearFiltering = 0
  gmem.texture("rednos").nearFiltering = 0
  gmem.texture("bluenos").nearFiltering = 0
  vtips = ["Speed boost trick styling for faster SUPERCHARGE.", "Use your own bombs to travel far.  ;)", "Use jump (SPACE) to flip over up turned.", "Try driving onto your own mines to get to unreachable areas", "Help each other, you cannot damage your own team mates", "WASD/Arrow + jump (SPACE) combo for trick jumps", "TAB & ENTER to Chat", "Nook em wise, nook em tactically", "Use ramps to help build trick bonuses for SUPERCHARGE", "Try high speed flipping onto steep walls & slopes to ride the vertical", "Right Mouse click to aim accurately", "Control big air SPEED jumps with flip boost", "Stuck... need that extra push? use your gun :)", "Flip trick to build charge to go faster!"]
  member("talk").text = "Tip: " & vtips[random(vtips.count)] & "!"
  vt = texy("talk")
  vt.nearFiltering = 0
  gmem.camera(1).addOverlay(vt, point(20, 560), 0)
  return me
end

on stepFrame me
  inc = inc + 1
  if inc = 60 then
    submitmus([#subject: "ignore", #content: EMPTY])
    inc = 0
    if gplayers.count > 0 then
      vteams = [0, 0]
      repeat with i = 1 to gplayers.count
        if string(gplayers[i].pteam) = "red" then
          vteams[1] = vteams[1] + 1
          next repeat
        end if
        vteams[2] = vteams[2] + 1
      end repeat
      if vteams[1] > vteams[2] then
        gteamok = ["blue"]
      else
        if vteams[2] > vteams[1] then
          gteamok = ["red"]
        else
          gteamok = ["red", "blue"]
        end if
      end if
    else
      gteamok = ["red", "blue"]
    end if
    updateoverlays()
  end if
end

on updateoverlays me
  member("rednos").text = string(vteams[1])
  texy("rednos", 0)
  member("bluenos").text = string(vteams[2])
  texy("bluenos", 0)
  member("UI_trans").posterFrame = 2
  texy("UI_trans")
end

on hurt me, howbad, vnom
end

on destroy me
  (the actorList).deleteOne(me)
  me = VOID
end
