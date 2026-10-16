property pspr, pmem, pstager, purl, pnetid, pwebstep, pausetimer, pweaponstate
global gmplayer, nom, mus, gmusmode, gmygroup, gmaxusers, gteam, gmousediff, ghelp, ggunmode, gisloggedin, gstats, gfilter, gsession

on beginSprite me
  puppetSound(1, "renook")
  sound(1).volume = 50
  if member("loggedin").text <> EMPTY then
    gisloggedin = 1
    gsession = member("loggedin").text
    vdataload = script("dataminer").new()
    vdataload.pstate = "getmytank"
  else
    script("dataminer").new()
  end if
  pspr = sprite(me.spriteNum)
  gmousediff = 1
  ghelp = 1
  vcheckpref = _player.getPref("teamtanks")
  if (vcheckpref <> "0") and not voidp(vcheckpref) and ((EMPTY & vcheckpref) <> EMPTY) then
    vprefs = value(_player.getPref("teamtanks"))
    gmousediff = (float(vprefs[1]) / 100) + 0.5
    ghelp = vprefs[2]
    if vprefs.count > 2 then
      ggunmode = vprefs[3]
      setflash("_root.gunmode", string(ggunmode))
      setflash("_root.help", string(ghelp))
    else
      setflash("_root.help", string(1))
    end if
    setflash("_root.mousediff", string(vprefs[1]))
  else
    gmousediff = 1
    ghelp = 1
    ggunmode = 0
    setflash("_root.mousediff", "50")
    setflash("_root.help", "1")
    setflash("_root.gunmode", "0")
  end if
  if voidp(gteam) then
    gteam = #red
  end if
  setflash("_root.who", string(gteam))
  if nom <> VOID then
    setflash("_root.codename", string(nom))
  else
    setflash("_root.codename", EMPTY)
  end if
  purl = "http://www.gamevial.com/data/gamecomms.php"
  pnetid = 0
  pwebstep = 0
  set the exitLock to 0
end

on exitFrame me
  if gmusmode = "game" then
    go(3)
  else
    vstate = getflash("_root.state")
    case vstate of
      "exit":
        exitgame()
        setflash("_root.state", "wait")
      "start":
        if member("datacal").text <> EMPTY then
          vallpremweaps = ["lasergun", "mgunx2", "rocketx4", "remotemine", "sonicgun", "guidedmissile", "thrusters", "mortar", "airstrike", "rcbomb", "rcrocket", "health", "stealth"]
          vnom = member("datacal").text
          the itemDelimiter = ";"
          vday = integer(vnom.item[3])
          vnum = vday mod 13
          if vnum = 0 then
            vnum = 13
          end if
          setflash("_root.freebee", vallpremweaps[vnum])
          setflash("_root.state", "wait")
        end if
      "getcodename":
        if gisloggedin then
          setflash("_root.state", "getroom")
        end if
      "weapons":
        vweaponstate = string(pspr.weaponry.state)
        case vweaponstate of
          "init":
            if member("datame").text <> EMPTY then
              the itemDelimiter = ";"
              vbeans = member("datame").text.item[2]
              pspr.weaponry.mycredits = integer(vbeans)
            else
              pspr.weaponry.mycredits = integer(0)
            end if
            vweaplist = ["mgun", "bgun", "nook", "rocket", "proximitymine", "speed"]
            if member("dataweapons").text <> EMPTY then
              vnom = member("dataweapons").text
              the itemDelimiter = ";"
              vbits = []
              repeat with i = 2 to vnom.item.count
                vbits.add(vnom.item[i])
              end repeat
              the itemDelimiter = ":"
              repeat with i = 1 to vbits.count
                vvnom = vbits[i]
                vweaplist.add(vvnom.item[1])
              end repeat
            end if
            vallweaps = ["mgun", "bgun", "nook", "rocket", "proximitymine", "speed", "lasergun", "mgunx2", "rocketx4", "remotemine", "sonicgun", "guidedmissile", "thrusters", "mortar", "airstrike", "rcbomb", "rcrocket", "health", "stealth", "blank"]
            repeat with i = 1 to vallweaps.count
              if vweaplist.getOne(vallweaps[i]) then
                pspr.weaponry.vlocks.push(1)
                next repeat
              end if
              pspr.weaponry.vlocks.push(0)
            end repeat
            pspr.weaponry.sortshop()
            pspr.weaponry.state = "shopping"
          "shopping":
          "buycoins":
            psubmit = string(getVariable(pspr, "_root.psubmit"))
            if psubmit = "true" then
              alert("buy buy")
              gotoNetPage("http://www.gamevial.com/data/shopzone.php", "_blank")
              setVariable(pspr, "_root.psubmit", "false")
              pspr.weaponry.state = EMPTY
            end if
          "buyweapons":
            if pwebstep = 0 then
              psubmit = string(getVariable(pspr, "_root.psubmit"))
              if psubmit = "true" then
                vweaps = string(pspr.weaponry.vweaplist)
                vcont = ["action": "purchase", "game": "teamtanks", "items": vweaps, "sessionID": gsession]
                pnetid = postNetText(purl, vcont)
                setVariable(pspr, "_root.psubmit", "false")
                pwebstep = 1
              end if
            else
              if netDone(pnetid) then
                if netError(pnetid) = "OK" then
                  Msg = netTextResult(pnetid)
                  the itemDelimiter = ";"
                  if Msg.item[1] = "1" then
                    member("dataweapons").text = Msg
                    pspr.weaponry.gotoAndStop(4)
                  else
                    member("dataweapons").text = EMPTY
                    if Msg.item[1] = "0" then
                      if Msg.item[2] = "notenoughbeans" then
                        pspr.weaponry.gotoAndStop(5)
                      else
                        if Msg.item[2] = "noitemsrequested" then
                          pspr.weaponry.gotoAndStop(6)
                        else
                          pspr.weaponry.gotoAndStop(7)
                        end if
                      end if
                    end if
                  end if
                  pwebstep = 0
                else
                  pnetid = 0
                  pwebstep = 0
                end if
                pspr.weaponry.state = EMPTY
              else
                presult = "Connecting"
              end if
            end if
          EMPTY:
        end case
        vweap = getflash("_root.weaponry.sales")
        sendSprite(1, #setweap, vweap)
      "verifyname":
        gteam = value("#" & getflash("_root.who"))
        nom = getflash("_root.codename")
        nom = VerifyUserName(nom)
        setflash("_root.codename", nom)
        if nom <> EMPTY then
          setflash("_root.state", "getroom")
        else
          setflash("_root.state", "getcodename")
        end if
      "getroom":
        if gmusmode <> "start" then
          setflash("_root.state", "wait")
          sconnect()
        end if
      "foundrooms":
        jrooms(me)
      "joinrooms":
        jrooms(me)
      "refresh":
        gmusmode = "getrooms"
        gfilter = getflash("_root.filter")
        setflash("_root.state", "wait")
      "savesettings":
        _player.setPref("teamtanks", string("[" & getflash("_root.mousediff") & "," & getflash("_root.help") & "," & getflash("_root.gunmode") & "]"))
        gmousediff = (float(integer(getflash("_root.mousediff"))) / 100) + 0.5
        ghelp = integer(getflash("_root.help"))
        ggunmode = integer(getflash("_root.gunmode"))
        setflash("_root.state", "wait")
      "calender":
        if member("datacal").text <> EMPTY then
          vnom = member("datacal").text
          the itemDelimiter = ";"
          pspr.calender.vday = vnom.item[1]
          pspr.calender.vdays_in_this_month = vnom.item[2]
          pspr.calender.vbp = vnom.item[3]
          pspr.calender.sortcal()
        end if
        setflash("_root.state", "wait")
      "mytank":
        if gisloggedin then
          vnom = member("datame").text
          the itemDelimiter = ";"
          pspr.mytank.mname = vnom.item[1]
          vnom = member("datamytank").text
          the itemDelimiter = ";"
          vrankpos = integer(vnom.item[1])
          vranks = ["Tank Private", "Tank Gunner", "Tank Commander", "Tank Style Technician", "Tank Captain", "Chief Style Technician", "Corporal", "Sergeant", "Gunnery Sergeant", "Master Sergeant", "Master Gunnary Sergeant", "Sergeant Major", "Veteran", "Special Ops"]
          vrankname = vranks[vrankpos]
          pspr.mytank.mrank = vrankname
          pspr.mytank.mrankclear.gotoAndStop(vnom.item[1])
          pspr.mytank.mrankshad.gotoAndStop(vnom.item[1])
          pspr.mytank.mserial = vnom.item[2]
          if member("dataweapons").text <> EMPTY then
            vnom = member("dataweapons").text
            the itemDelimiter = ";"
            vbits = []
            repeat with i = 2 to vnom.item.count
              vbits.add(vnom.item[i])
            end repeat
            the itemDelimiter = ":"
            repeat with i = 1 to vbits.count
              vvnom = vbits[i]
              pspr.mytank.myitems.push(vvnom.item[1])
              pspr.mytank.myitems_days.push(vvnom.item[2])
            end repeat
            pspr.mytank.setitems()
          end if
        else
          pspr.mytank.blocker.gotoAndStop(2)
        end if
        setflash("_root.state", "wait")
      "stats":
        if gisloggedin then
          vgetstats = member("datastats").text
          vstats = value(vgetstats)
          vad = pspr.mytank.content.contentMain
          vad.max_points = vstats.max_points
          vad.max_killed = vstats.max_killed
          vad.total_killed = vstats.total_killed
          vad.dte_mgun = vstats.damage_to_enemy.mgun
          vad.dte_bgun = vstats.damage_to_enemy.bgun
          vad.dte_nook = vstats.damage_to_enemy.nook
          vad.dte_rocket = vstats.damage_to_enemy.rocket
          vad.dte_proximitymine = vstats.damage_to_enemy.proximitymine
          vad.dte_speed = vstats.damage_to_enemy.speed
          vad.dte_lasergun = vstats.damage_to_enemy.lasergun
          vad.dte_mgunx2 = vstats.damage_to_enemy.mgunx2
          vad.dte_rocketx4 = vstats.damage_to_enemy.rocketx4
          vad.dte_remotemine = vstats.damage_to_enemy.remotemine
          vad.dte_sonicgun = vstats.damage_to_enemy.sonicgun
          vad.dte_guidedmissile = vstats.damage_to_enemy.guidedmissile
          vad.dte_thrusters = vstats.damage_to_enemy.thrusters
          vad.dte_mortar = vstats.damage_to_enemy.mortar
          vad.dte_airstrike = vstats.damage_to_enemy.airstrike
          vad.dte_rcbomb = vstats.damage_to_enemy.rcbomb
          vad.dte_rcrocket = vstats.damage_to_enemy.rcrocket
          vad.dte_health = vstats.damage_to_enemy.health
          vad.dte_stealth = vstats.damage_to_enemy.stealth
          vad.total_deaths = vstats.total_deaths
          vad.total_respawns = vstats.total_respawns
          vad.max_captures = vstats.max_captures
          vad.total_captures = vstats.total_captures
          vad.battles_fought = vstats.battles_fought
          vad.max_airtime = vstats.max_airtime
          vad.max_tricksize = vstats.max_tricksize
          vad.max_trickpulled = vstats.max_trickpulled
          vad.top_speed = vstats.top_speed
          vad.acc_mgun = vstats.accuracy.mgun
          vad.acc_bgun = vstats.accuracy.bgun
          vad.acc_nook = vstats.accuracy.nook
          vad.acc_rocket = vstats.accuracy.rocket
          vad.acc_proximitymine = vstats.accuracy.proximitymine
          vad.acc_speed = vstats.accuracy.speed
          vad.acc_lasergun = vstats.accuracy.lasergun
          vad.acc_mgunx2 = vstats.accuracy.mgunx2
          vad.acc_rocketx4 = vstats.accuracy.rocketx4
          vad.acc_remotemine = vstats.accuracy.remotemine
          vad.acc_sonicgun = vstats.accuracy.sonicgun
          vad.acc_guidedmissile = vstats.accuracy.guidedmissile
          vad.acc_thrusters = vstats.accuracy.thrusters
          vad.acc_mortar = vstats.accuracy.mortar
          vad.acc_airstrike = vstats.accuracy.airstrike
          vad.acc_rcbomb = vstats.accuracy.rcbomb
          vad.acc_rcrocket = vstats.accuracy.rcrocket
          vad.acc_health = vstats.accuracy.health
          vad.max_ubers = vstats.max_ubers
          vad.total_ubers = vstats.total_ubers
        else
          pspr.mytank.blocker.gotoAndStop(2)
        end if
        setflash("_root.state", "wait")
      "achievements":
        if gisloggedin then
          vnom = member("datamytank").text
          the itemDelimiter = ";"
          nrank = vnom.item[1]
          nticks = 0
          vgetstats = member("datastats").text
          nstat = value(vgetstats)
          vad = pspr.mytank.content.contentMain
          case nrank of
            "Tank Private":
              if nstat.total_killed >= 20 then
                vad.a1.gotoAndStop(2)
              end if
              if nstat.team_wins >= 2 then
                vad.a2.gotoAndStop(2)
              end if
            "Tank Gunner":
              nticks = 2
              if nstat.award_round_challenges[1] = 1 then
                vad.a3.gotoAndStop(2)
              end if
              if nstat.total_killed >= 50 then
                vad.a4.gotoAndStop(2)
              end if
              if nstat.award_round_challenges[2] = 1 then
                vad.a5.gotoAndStop(2)
              end if
            "Tank Commander":
              nticks = 5
              if nstat.award_round_challenges[3] = 1 then
                vad.a6.gotoAndStop(2)
              end if
              if nstat.max_airtime >= 2000 then
                vad.a7.gotoAndStop(2)
              end if
              if nstat.total_killed >= 200 then
                vad.a8.gotoAndStop(2)
              end if
            "Tank Style Technician":
              nticks = 8
              if nstat.award_round_challenges[4] = 1 then
                vad.a9.gotoAndStop(2)
              end if
              if nstat.total_killed >= 500 then
                vad.a10.gotoAndStop(2)
              end if
              if nstat.award_topscoretimes >= 5 then
                vad.a11.gotoAndStop(2)
              end if
            "Tank Captain":
              nticks = 11
              if nstat.max_airtime >= 40000 then
                vad.a12.gotoAndStop(2)
              end if
              if nstat.award_topscoretimes >= 20 then
                vad.a13.gotoAndStop(2)
              end if
              if nstat.award_round_challenges[5] = 1 then
                vad.a14.gotoAndStop(2)
              end if
            "Chief Style Technician":
              nticks = 14
              vcheck = 0
              repeat with i = 1 to nstat.damage_to_enemy.count
                if integer(nstat.damage_to_enemy.getProp(nstat.damage_to_enemy.getPropAt(i))) > 0 then
                  vcheck = vcheck + 1
                end if
              end repeat
              if vcheck >= 10 then
                vad.a15.gotoAndStop(2)
              end if
              if nstat.award_round_challenges[6] = 1 then
                vad.a16.gotoAndStop(2)
              end if
              if nstat.total_killed >= 1000 then
                vad.a17.gotoAndStop(2)
              end if
            "Corporal":
              nticks = 17
              if nstat.award_topscoretimes >= 50 then
                vad.a18.gotoAndStop(2)
              end if
              if nstat.award_recruits >= 3 then
                vad.a19.gotoAndStop(2)
              end if
            "Sergeant":
              nticks = 19
              if nstat.award_round_challenges[7] = 1 then
                vad.a20.gotoAndStop(2)
              end if
              if nstat.total_killed >= 2000 then
                vad.a21.gotoAndStop(2)
              end if
            "Gunnery Sergeant":
              nticks = 21
              if nstat.award_round_challenges[8] = 1 then
                vad.a22.gotoAndStop(2)
              end if
            "Master Sergeant":
              nticks = 22
              if nstat.award_round_challenges[9] = 1 then
                vad.a23.gotoAndStop(2)
              end if
            "Master Gunnary Sergeant":
              nticks = 23
              if nstat.total_killed >= 5000 then
                vad.a24.gotoAndStop(2)
              end if
            "Sergeant Major":
              nticks = 24
              if nstat.battles_fought >= 1000 then
                vad.a25.gotoAndStop(2)
              end if
            "Veteran":
              nticks = 25
              if nstat.award_round_challenges[10] = 1 then
                vad.a26.gotoAndStop(2)
              end if
            "Special Ops":
              nticks = 26
          end case
          vad.pticks = nticks
          vad.sortticks()
        else
          pspr.mytank.blocker.gotoAndStop(2)
        end if
        setflash("_root.state", "wait")
      "register":
        if pwebstep = 0 then
          psubmit = string(getVariable(pspr, "_root.psubmit"))
          if psubmit = "true" then
            vusername = string(getVariable(pspr, "_root.username"))
            vokusername = VerifyUserName(vusername)
            if vokusername <> EMPTY then
              vpassword = string(getVariable(pspr, "_root.password"))
              vemail = string(getVariable(pspr, "_root.email"))
              vfullname = string(getVariable(pspr, "_root.fullname"))
              vcont = ["action": "register", "username": vokusername, "password": vpassword, "email": vemail]
              pnetid = postNetText(purl, vcont)
              setVariable(pspr, "_root.psubmit", "false")
              pwebstep = 1
            end if
          end if
        else
          if netDone(pnetid) then
            if netError(pnetid) = "OK" then
              Msg = netTextResult(pnetid)
              the itemDelimiter = ";"
              if Msg.item[1] = "1" then
                member("datame").text = Msg.item[2] & ";" & Msg.item[3]
                gsession = Msg.item[4]
                gisloggedin = 1
                nom = Msg.item[2]
                vtxt = "Logged in. Gamevial player " & nom & " created, game loading. Your login details have been emailed to you"
                setVariable(pspr, "_root.messagetxt", vtxt)
                setflash("_root.state", "regpause")
                vdataload = script("dataminer").new()
                vdataload.pstate = "getmytank"
              else
                pwebstep = 0
                setVariable(pspr, "_root.messagetxt", Msg.item[2])
              end if
            else
              setVariable(pspr, "_root.messagetxt", "Unable to connect")
            end if
          else
            setVariable(pspr, "_root.messagetxt", "Connecting")
          end if
        end if
      "login":
        if pwebstep = 0 then
          psubmit = string(getVariable(pspr, "_root.psubmit"))
          if psubmit = "true" then
            vusername = string(getVariable(pspr, "_root.username"))
            vpassword = string(getVariable(pspr, "_root.password"))
            vcont = ["action": "login", "username": vusername, "password": vpassword]
            pnetid = postNetText(purl, vcont)
            setVariable(pspr, "_root.psubmit", "false")
            pwebstep = 1
          end if
        else
          if netDone(pnetid) then
            if netError(pnetid) = "OK" then
              Msg = netTextResult(pnetid)
              the itemDelimiter = ";"
              if Msg.item[1] = "1" then
                member("datame").text = Msg.item[2] & ";" & Msg.item[3]
                gsession = Msg.item[4]
                gisloggedin = 1
                nom = Msg.item[2]
                vtxt = "Success player " & nom & " logged in, game loading."
                setVariable(pspr, "_root.messagetxt", vtxt)
                setflash("_root.state", "regpause")
                vdataload = script("dataminer").new()
                vdataload.pstate = "getmytank"
              else
                pnetid = 0
                pwebstep = 0
                setVariable(pspr, "_root.messagetxt", "Wrong username or password. Please try again or register for a free.")
              end if
            else
              setVariable(pspr, "_root.messagetxt", "Unable to connect")
            end if
          else
            setVariable(pspr, "_root.messagetxt", "Connecting")
          end if
        end if
      "regpause":
        pnetid = 0
        pwebstep = 0
        pausetimer = pausetimer + 1
        if pausetimer > 50 then
          pausetimer = 0
          setflash("_root.state", "getroom")
          pspr.goToFrame("getroom")
        end if
      "leapto":
        setflash("_root.state", EMPTY)
      EMPTY:
    end case
    if vstate = "weapons" then
      if (pspr.weaponry.state = "init") or (pspr.weaponry.state = "shopping") then
        go(2)
      else
        go(1)
        lobbyframe()
      end if
    else
      go(1)
      lobbyframe()
    end if
  end if
end

on jrooms me
  sprite(3).visible = 1
  vscroll = getflash("_root.scroll")
  vmem = member("rooms")
  if vscroll = "up" then
    vmem.scrollTop = vmem.scrollTop - 26
  else
    if vscroll = "down" then
      vmem.scrollTop = vmem.scrollTop + 26
    end if
  end if
end
