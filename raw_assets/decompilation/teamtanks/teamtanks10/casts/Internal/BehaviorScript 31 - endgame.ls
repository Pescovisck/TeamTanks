property pstarttime, ptimer, pcam, pdiy, pingserver, predtxt, pbluetxt, pwinners, pscoresent
global gmem, gplayers, gmusmode, gisloggedin, goody, gscore, goldscore, gcappoints, glevel

on beginSprite me
  pscoresent = 1
  pcam = gmem.camera(1)
  member("UI_trans").posterFrame = 3
  pcam.addOverlay(texy("UI_trans"), point(0, 0), 0)
  pingserver = 0
  vcapscores = 0
  repeat with i = 1 to gcappoints.count
    vcapscores = vcapscores + gcappoints[i].pglow[3]
    gcappoints[i].resetglows()
  end repeat
  vcps = integer(127 * gcappoints.count)
  if vcapscores > vcps then
    vwinners = "Blue Win"
    member("winners").color = rgb(0, 1, 217)
    member("winners").bgColor = rgb(0, 1, 217)
  else
    if vcapscores < vcps then
      vwinners = "Red Win"
      member("winners").color = rgb(217, 1, 0)
      member("winners").bgColor = rgb(217, 1, 0)
    else
      vwinners = "Draw"
      member("winners").color = rgb(255, 215, 0)
      member("winners").bgColor = rgb(255, 215, 0)
    end if
  end if
  member("winners").text = vwinners
  pwinners = EMPTY
  if vwinners = "Blue Win" then
    pwinners = "blue"
  else
    if vwinners = "Red Win" then
      pwinners = "red"
    end if
  end if
  gmem.camera(1).addOverlay(texy("winners", 0), point(20, 14), 0)
  gmem.camera(1).addOverlay(texy("scoretimer", 0), point(300, 500), 0)
  member("scoresubmitted").text = EMPTY
  startTimer()
  ptimer = 0
  pdiy = 1
  puppetSound(8, "endwav")
  _player.cursor(-1)
  dostats(me)
  vurl = "http://www.gamevial.com/data/gamecomms.php"
  vdata = ["action": "stats", "kills": goody.pstats.pkills]
  postNetText(vurl, vdata)
  put EMPTY & vdata
end

on dostats me
  member("redscores").text = EMPTY
  member("bluescores").text = EMPTY
  if not voidp(_player.getPref("teamtanks_data")) then
    vprefs = value(_player.getPref("teamtanks_data"))
    if string(vprefs.date) <> getsafedate() then
      vkillstoday = goody.pstats.pkills
      vmaxpoints = goody.pstats.pscore
      vaccuracy = getaccuracy(me)
      vrating = getrating(me)
      vgamewins = checkwins(me)
      vgametotal = 1
      vdate = getsafedate()
      _player.setPref("teamtanks_data", string("[#date:" & vdate & ", #max_points:" & vmaxpoints & ", #kills:" & goody.pstats.pkills & ", #kills_today:" & vkillstoday & ", #accuracy:" & vaccuracy & ", #rating:" & vrating & ", #game_wins:" & vgamewins & ", #games_total:" & vgametotal & "]"))
    else
      if goody.pstats.pscore > vprefs.max_points then
        vmaxpoints = goody.pstats.pscore
      else
        vmaxpoints = vprefs.max_points
      end if
      vkillstoday = goody.pstats.pkills + vprefs.kills_today
      vaccuracy = getaccuracy(me)
      vrating = getrating(me)
      vgamewins = integer(vprefs.game_wins) + checkwins(me)
      vgametotal = integer(vprefs.games_total) + 1
      vdate = getsafedate()
      _player.setPref("teamtanks_data", string("[" & "#date:" & vdate & ", #max_points:" & vmaxpoints & ", #kills:" & goody.pstats.pkills & ", #kills_today:" & vkillstoday & ", #accuracy:" & vaccuracy & ", #rating:" & vrating & ", #game_wins:" & vgamewins & ", #games_total:" & vgametotal & "]"))
    end if
  else
    vkillstoday = goody.pstats.pkills
    vmaxpoints = goody.pstats.pscore
    vaccuracy = getaccuracy(me)
    vrating = getrating(me)
    vgamewins = checkwins(me)
    vdate = getsafedate()
    vchav = string("[#date:" & vdate & ", #max_points:" & vmaxpoints & ", #kills:" & vkillstoday & ", #kills_today:" & vkillstoday & ", #accuracy:" & vaccuracy & ", #rating:" & vrating & ", #game_wins:" & vgamewins & ", #games_total:1]")
    _player.setPref("teamtanks_data", vchav)
  end if
  member("redscores").text = goody.pstats.pscore & RETURN & goody.pstats.pkills & RETURN & vaccuracy & RETURN & vrating
  member("bluescores").text = vmaxpoints & RETURN & RETURN & vkillstoday & RETURN & vgamewins & RETURN & vgametotal
  vredtxt = gmem.camera(1).addOverlay(texy("redscores"), point(83 + 200, 279), 0)
  predtxt = gmem.camera(1).overlay.count
  vbluetxt = gmem.camera(1).addOverlay(texy("bluescores"), point(393 + 200, 238), 0)
  pbluetxt = gmem.camera(1).overlay.count
end

on getaccuracy me
  if goody.pstats.pshots_hit = 0 then
    vac = 0
  else
    vac = integer(float(goody.pstats.pshots_hit) / goody.pstats.pshots_total * 100)
  end if
  return vac
end

on checkwins me
  vwins = 0
  if pwinners = string(goody.pteam) then
    vwins = 1
  end if
  return vwins
end

on getrating me
  if goody.pstats.pscore < 10 then
    vrating = "1/10"
  else
    if goody.pstats.pscore < 100 then
      vrating = "2/10"
    else
      if goody.pstats.pscore < 500 then
        vrating = "4/10"
      else
        if goody.pstats.pscore < 2000 then
          vrating = "6/10"
        else
          if goody.pstats.pscore < 3500 then
            vrating = "7/10"
          else
            if goody.pstats.pscore < 5000 then
              vrating = "8/10"
            else
              vrating = "10/10"
            end if
          end if
        end if
      end if
    end if
  end if
  return vrating
end

on doscores me
  gmem.camera(1).overlay[2].blend = 0
  member("UI_trans").posterFrame = 4
  texy("UI_trans")
  member("redscores").text = EMPTY
  member("bluescores").text = EMPTY
  vreds = [:]
  vblues = [:]
  repeat with i = 1 to gplayers.count
    if string(gplayers[i].pteam) = "red" then
      vreds.addProp(value("#" & string(gplayers[i].pscore)), gplayers[i].pname)
      next repeat
    end if
    vblues.addProp(value("#" & string(gplayers[i].pscore)), gplayers[i].pname)
  end repeat
  vreds.sort()
  if vreds.count > 0 then
    if vreds[vreds.count] = goody.pname then
      if vreds.getOne(goody.pname) = goody.pstats.pscore then
        submithighscore(me)
      end if
    end if
  end if
  repeat with i = 1 to vreds.count
    member("redscores").text = member("redscores").text & vreds[vreds.count + 1 - i]
    qwe = vreds[vreds.count + 1 - i]
    qwe = string(qwe).char.count
    qwe = integer(qwe)
    qwe = 17 - qwe
    repeat with v = 1 to qwe
      member("redscores").text = member("redscores").text & "_"
    end repeat
    member("redscores").text = member("redscores").text & vreds.getOne(vreds[vreds.count + 1 - i]) & RETURN
  end repeat
  texy("redscores")
  vblues.sort()
  if vblues.count > 0 then
    if vblues[vblues.count] = goody.pname then
      if vblues.getOne(goody.pname) = goody.pstats.pscore then
        submithighscore(me)
      end if
    end if
  end if
  repeat with i = 1 to vblues.count
    member("bluescores").text = member("bluescores").text & vblues[vblues.count + 1 - i]
    qwe = vblues[vblues.count + 1 - i]
    qwe = string(qwe).char.count
    qwe = integer(qwe)
    qwe = 17 - qwe
    repeat with v = 1 to qwe
      member("bluescores").text = member("bluescores").text & "_"
    end repeat
    member("bluescores").text = member("bluescores").text & vblues.getOne(vblues[vblues.count + 1 - i]) & RETURN
  end repeat
  texy("bluescores")
  gmem.camera(1).overlay[predtxt].loc = point(83, 279)
  gmem.camera(1).overlay[pbluetxt].loc = point(393, 238)
  if gisloggedin then
    goody.pstats.pwin = checkwins(me)
    if (vreds[vreds.count] = goody.pname) or (vblues[vblues.count] = goody.pname) then
      goody.pstats.ptopscore = 1
    end if
    goody.pstats.updatestats()
  end if
end

on submithighscore me
  if pscoresent then
    if goody.pstats.pscore = integer(goldscore * 8.29564210000000024) then
      if goody.pstats.pscore > 100 then
        vurl = "http://www.gamevial.com/scoreboard.php"
        vdata = ["game": "tt" & glevel.name & glevel.level, "score": goody.pstats.pscore, "nickname": goody.pname]
        postNetText(vurl, vdata)
        vdata = ["game": "teamtanks", "score": goody.pstats.pscore, "nickname": goody.pname]
        postNetText("http://www.gamevial.com/scoreboard.php", vdata)
        member("scoresubmitted").text = "Highscore Added"
        gmem.camera(1).addOverlay(texy("scoresubmitted"), point(587, 487), 0)
      end if
    end if
    pscoresent = 0
  end if
end

on exitFrame me
  if checkgoody() then
    if ptimer <> (the timer / 60) then
      ptimer = the timer / 60
      member("scoretimer").text = string(16 - ptimer)
      gmem.texture("scoretimer").member = member("scoretimer")
      pingserver = pingserver + 1
      if pingserver = 10 then
        getmus()
        pingserver = 0
      end if
    end if
    if ptimer = 8 then
      if pdiy = 1 then
        doscores(me)
        pdiy = 0
      end if
    else
      if ptimer = 16 then
        vcount = pcam.overlay.count
        repeat with i = 1 to vcount
          pcam.removeOverlay(1)
        end repeat
        govlist = []
        gtaglist = []
        goody.replay()
        go("play")
      end if
    end if
  end if
end

on showpromotion me, nrank
  vrankpos = integer(nrank)
  vranks = ["Tank Private", "Tank Gunner", "Tank Commander", "Tank Style Technician", "Tank Captain", "Chief Style Technician", "Corporal", "Sergeant", "Gunnery Sergeant", "Master Sergeant", "Master Gunnary Sergeant", "Sergeant Major", "Veteran", "Special Ops"]
  alert("server confirmed promotion to: " & string(vranks[vrankpos]))
end

on mouseUp me
  sound(8).stop()
  creq()
end
