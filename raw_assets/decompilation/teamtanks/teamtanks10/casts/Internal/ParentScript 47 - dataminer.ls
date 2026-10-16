property pstate, ponce, pnetid, purl, pcal, pstats, pmytank, pweapons
global gisloggedin, nom, gsession

on new me
  ponce = 0
  pnetid = 0
  pstate = "isloggedin"
  purl = "http://www.gamevial.com/data/gamecomms.php"
  (the actorList).add(me)
  return me
end

on stepFrame me
  if pstate = "isloggedin" then
    if ponce = 0 then
      vcont = ["action": "isloggedin", "sessionID": gsession]
      pnetid = postNetText(purl, vcont)
      ponce = 1
      member("datame").text = EMPTY
      gsession = EMPTY
    else
      if netDone(pnetid) then
        if netError(pnetid) = "OK" then
          Msg = netTextResult(pnetid)
          the itemDelimiter = ";"
          if (Msg.item[1] = "1") and (Msg.item[2] <> EMPTY) and (Msg.item[3] <> EMPTY) then
            nom = Msg.item[2]
            member("datame").text = Msg.item[2] & ";" & Msg.item[3]
            gisloggedin = 1
            pstate = "getmytank"
          else
            pstate = "getcal"
          end if
          ponce = 0
        else
          presult = "Unable to connect"
        end if
      else
        presult = "Connecting"
      end if
    end if
  else
    if pstate = "getmytank" then
      if ponce = 0 then
        vcont = ["action": "mytank", "game": "teamtanks", "sessionID": gsession]
        pnetid = postNetText(purl, vcont)
        ponce = 1
        member("datamytank").text = EMPTY
      else
        if netDone(pnetid) then
          if netError(pnetid) = "OK" then
            Msg = netTextResult(pnetid)
            the itemDelimiter = ";"
            if (Msg.item[1] = "1") and (Msg.item[2] <> EMPTY) and (Msg.item[3] <> EMPTY) and (Msg.item[4] <> EMPTY) then
              member("datamytank").text = string(Msg.item[2] & ";" & Msg.item[3] & ";" & Msg.item[4])
            else
              member("datamytank").text = string("1;0;0")
            end if
            pstate = "getstats"
            ponce = 0
          else
            presult = "Unable to connect"
          end if
        else
          presult = "Connecting"
        end if
      end if
    else
      if pstate = "getstats" then
        if ponce = 0 then
          vcont = ["action": "stats", "game": "teamtanks", "sessionID": gsession]
          pnetid = postNetText(purl, vcont)
          ponce = 1
          member("datastats").text = EMPTY
        else
          if netDone(pnetid) then
            if netError(pnetid) = "OK" then
              Msg = netTextResult(pnetid)
              the itemDelimiter = ";"
              if (Msg.item[1] = "1") and (Msg.item[2] <> EMPTY) then
                member("datastats").text = string(Msg.item[2])
              else
                member("datastats").text = "[#max_points:0, #max_killed:0, #total_killed:0, #damage_to_enemy:[#mgun:0,#bgun:0,#nook:0,#rocket:0,#proximitymine:0,#speed:0,#lasergun:0, #mgunx2:0, #rocketx4:0, #remotemine:0, #sonicgun:0, #guidedmissile:0, #thrusters:0, #mortar:0, #airstrike:0, #rcbomb:0, #rcrocket:0,#health:0, #stealth:0], #total_deaths:0, #total_respawns:0, #max_captures:0, #total_captures:0, #team_wins:0, #battles_fought:0, #max_airtime:0, #max_tricksize:0, #max_trickpulled:0, #top_speed:0, #accuracy:[#mgun:0,#bgun:0,#nook:0,#rocket:0,#proximitymine:234,#speed:0,#lasergun:0, #mgunx2:0, #rocketx4:0, #remotemine:0, #sonicgun:0, #guidedmissile:0, #thrusters:0, #mortar:0, #airstrike:0, #rcbomb:0, #rcrocket:0,#health:0, #stealth:0], #max_ubers:0, #total_ubers:0, #award_topscoretimes:0, #award_recruits:0, #award_round_challenges:[0,0,0,0,0,0,0,0,0,0]]"
              end if
              pstate = "getweapons"
              ponce = 0
            else
              presult = "Unable to connect"
            end if
          else
            presult = "Connecting"
          end if
        end if
      else
        if pstate = "getweapons" then
          if ponce = 0 then
            vcont = ["action": "inventory", "game": "teamtanks", "sessionID": gsession]
            pnetid = postNetText(purl, vcont)
            ponce = 1
            member("dataweapons").text = EMPTY
          else
            if netDone(pnetid) then
              if netError(pnetid) = "OK" then
                Msg = netTextResult(pnetid)
                the itemDelimiter = ";"
                if Msg.item[1] = "1" then
                  member("dataweapons").text = Msg
                else
                  member("dataweapons").text = EMPTY
                end if
                pstate = "getcal"
                ponce = 0
              else
                presult = "Unable to connect"
              end if
            else
              presult = "Connecting"
            end if
          end if
        else
          if pstate = "getcal" then
            if ponce = 0 then
              vcont = ["action": "calendar", "sessionID": gsession]
              pnetid = postNetText(purl, vcont)
              ponce = 1
              member("datacal").text = EMPTY
            else
              if netDone(pnetid) then
                if netError(pnetid) = "OK" then
                  Msg = netTextResult(pnetid)
                  put "getcal bit: " & Msg
                  the itemDelimiter = ";"
                  if (Msg.item[1] = "1") and (Msg.item[2] <> EMPTY) and (Msg.item[3] <> EMPTY) then
                    member("datacal").text = Msg.item[2] & ";" & Msg.item[3] & ";" & Msg.item[4]
                  else
                    member("datacal").text = EMPTY
                  end if
                  die(me)
                else
                  die(me)
                end if
              else
                presult = "Connecting"
              end if
            end if
          end if
        end if
      end if
    end if
  end if
end

on die me
  (the actorList).deleteOne(me)
end
