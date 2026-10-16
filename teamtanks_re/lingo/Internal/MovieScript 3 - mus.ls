global gplayers, gredplayers, gblueplayers, mus, nom, goldnom, goody, gmusmode, gink, gmygroup, ggroupcount, gmaxusers, mla, govlist, gtaglist, gscore, gcappoints, glinecount, glevellist, glevel, groompos, gfilter, goldtime, gsubmitstamps

on sconnect me
  member("rooms").text = EMPTY
  gmygroup = VOID
  gink = 0
  gmaxusers = 10
  mus = new(xtra("MultiUser"))
  mla = "77.92.78.64"
  goldnom = "fig" & reversey(nom)
  mus.connectToNetServer([#logonInfo: [#userID: nom, #Password: "password", #movieid: "teamtanks2"], #remoteAddress: mla, #remoteTCPPort: 1626, #encryptionKey: "kwe123eefw3434mwe"])
  mus.setNetMessageHandler(#incoming, me)
  gmusmode = "start"
  gfilter = EMPTY
end

on reversey nstring
  vstr = EMPTY
  repeat with i = 1 to nstring.length
    vstr = vstr & char (nstring.length - i + 1) of nstring
  end repeat
  return vstr
end

on setflash var, val
  sprite(2).setVariable(var, val)
end

on getflash var
  flv = getVariable(sprite(2), var)
  return flv
end

on submitmus what
  if goldnom = ("fig" & reversey(nom)) then
    set the floatPrecision to 0
    Msg = mus.sendNetMessage([#recipients: gmygroup, #subject: what.subject, #content: what.content])
    set the floatPrecision to 3
  else
    gotoNetPage("http://www.gamevial.com", "_parent")
  end if
end

on submitone nwho, nwhat
  if goldnom = ("fig" & reversey(nom)) then
    set the floatPrecision to 0
    Msg = mus.sendNetMessage([#recipients: nwho, #subject: nwhat.subject, #content: nwhat.content])
    set the floatPrecision to 3
  else
    gotoNetPage("http://www.gamevial.com", "_parent")
  end if
end

on gettime
  Msg = mus.sendNetMessage([#recipients: "system.server.getTime", #subject: "gettime", #content: EMPTY])
end

on getmus
  if mus <> VOID then
    err = mus.getNumberWaitingNetMessages()
    if err > 0 then
      mus.checkNetMessages(err)
    end if
  end if
end

on incoming me
  if mus <> VOID then
    Msg = mus.getNetMessage()
    if gmusmode = "game" then
      gamein(Msg)
    else
      lobbyin(Msg)
    end if
  end if
end

on gamein Msg
  if not voidp(goody) then
    data = Msg.content
    vsend = Msg.senderid
    vbad = getplayer(vsend)
    if Msg.subject = "talk" then
      goody.feedback(data, vbad.pteam, vbad.pname)
    else
      if vsend <> nom then
        case Msg.subject of
          "rocket":
            if vbad <> 0 then
              script("rockets").new(data.pos, data.rot, vsend, data.pteam, data.pid, data.typ)
            end if
          "nook":
            if vbad <> 0 then
              script("nooks").new(data.pos, data.rot, vsend, data.pteam, data.pid)
            end if
          "mine":
            if vbad <> 0 then
              script("mines").new(data.pos, data.rot, vsend, data.pteam, data.pid, data.typ)
            end if
          "health":
            if vbad <> 0 then
              script("healthscript").new(data.pos, data.rot, data.pid, vsend)
            end if
          "bgun":
            if vbad <> 0 then
              script("shells").new(data.pos, data.rot, vsend, data.pteam, data.pid)
            end if
          "airstrike":
            if vbad <> 0 then
              script("airstrike").new(data.pos, data.rot, vsend, data.pteam, data.pid)
            end if
          "mortar":
            if vbad <> 0 then
              script("mortars").new(data.pos, data.rot, vsend, data.pteam, data.pid)
            end if
          "guidedmissile":
            if vbad <> 0 then
              script("guidedmissile").new(data.pos, data.pendpos, data.pwhogotit, vsend, data.pid, data.pteam)
            end if
          "sonicblast":
            if vbad <> 0 then
              script("sonicblast").new(data.pos, data.pendpos, vsend, data.pid, data.pteam)
            end if
          "health":
            if vbad <> 0 then
              script("healthscript").new(data.pos, data.rot, data.pid)
            end if
          "detonate":
            repeat with act in the actorList
              if act.getaProp(#pid) = data.pid then
                act.detonate()
                exit repeat
              end if
            end repeat
          "where":
            if vbad <> 0 then
              vbad.newstuff(data)
              myhurts = data.getaProp(#myhu)
              if myhurts > 0 then
                vbad.hurt(myhurts)
              end if
              shots = data.getaProp(#shots)
              if shots > 0 then
                vbad.misses = shots
              end if
              vbad.pweapon = data.pweapon
              hurts = data.getaProp(#hurts)
              if hurts > 0 then
                dohurts(hurts, vsend)
              end if
              vscores = data.getaProp(#scores)
              if vscores > 0 then
                vbad.pscore = vscores
              end if
              vcaps = data.getaProp(#cap)
              if vcaps > 0 then
                vcap = gcappoints[vcaps[2]]
                vcap.pushglows(data.team, vcaps[1])
              end if
              vstealth = data.getaProp(#stealth)
              if vstealth > 0 then
                if vbad.pstealth <> vstealth then
                  vbad.sortstealth(vstealth)
                end if
              else
                if vbad.pstealth <> 0 then
                  vbad.sortstealth(0)
                end if
              end if
              vthrust = data.getaProp(#thrust)
              if vthrust > 0 then
                if vbad.pthrust <> vthrust then
                  vbad.sortthrust(vthrust)
                end if
              else
                if vbad.pthrust <> 0 then
                  vbad.sortthrust(0)
                end if
              end if
              vremotedata = data.getaProp(#rc)
              if vremotedata > 0 then
                vbad.sortremote(1, vremotedata)
              else
                if vbad.premotestate <> 0 then
                  vbad.sortremote(0)
                end if
              end if
            else
              vtype = data.getaProp(#pteam)
              if vtype = 0 then
                data.addProp(#pteam, #red)
              else
                allowed = [#red, #blue]
                if allowed.getOne(vtype) = 0 then
                  data.ptype = #red
                end if
              end if
              vbad = script("baddies").new(Msg)
              goody.feedback(vsend & " joins " & data.team)
            end if
          "capupdate":
            vcap = gcappoints[data.id]
            vcap.ptarglow = data.glow
          "cappoint":
            vcap = gcappoints[data.id]
            vcap.pushglows(data.team, data.val)
          "dead":
            if vbad <> 0 then
              vweaplist = [#mine, #gun, #mgun, #bgun, #nook, #rocket, #proximitymine, #speed, #lasergun, #mgunx2, #rocketx4, #remotemine, #sonicgun, #guidedmissile, #thrusters, #mortar, #airstrike, #rcbomb, #rcrocket, #health, #stealth]
              script("bangs").new(vbad.pos, "dead", vsend)
              vbad.hurt()
              vbad.repos(data.pos, data.rot, data.typ, data.velo, data.vang)
              if vweaplist.getOne(data.typ) > 0 then
                vweap = vweaplist.getOne(data.typ)
              else
                vweap = " gets "
              end if
              vdesc = [" mines ", " guns ", " guns ", " cannons ", " nooks ", " rockets ", " mines ", " gets ", " lasers ", " twin 73's ", " tankbusts ", " remote mines ", " sonic blasts ", " missiles ", " gets ", " mortars ", " airstrikes ", " remote bombs ", " remote rockets ", " gets ", " gets "]
              if data.killer = goody.pname then
                goody.setscore(200)
                goody.pstats.pkills = goody.pstats.pkills + 1
                if goody.pcapture = 1 then
                  goody.pstats.pdefends = goody.pstats.pdefends + 1
                end if
                if string(data.typ) = "nook" then
                  goody.pstats.pnukebbq = goody.pstats.pnukebbq + 1
                end if
              end if
              vstr = EMPTY
              if vweap = " gets " then
                vstr = data.killer & vweap & vsend
              else
                vstr = data.killer & vdesc[vweap] & vsend
              end if
              if data.killer = "Re play" then
              else
                if data.killer = "Re spawn" then
                  goody.feedback(vsend & " respawns")
                else
                  goody.feedback(vstr)
                end if
              end if
            end if
          "super":
            if vbad <> 0 then
              vbad.supercharge()
            end if
          "endsuper":
            if vbad <> 0 then
              vbad.endsupercharge()
            end if
          "left":
            if vbad <> 0 then
              script("bangs").new(vbad.pos, "dead", vsend)
              vbad.die()
              goody.feedback(vsend & " leaves")
            end if
          "helloworld":
            if (goody.pstate = "play") or (goody.pstate = "repos") then
              repeat with vcap in gcappoints
                vcap.updateglows(vsend)
              end repeat
            end if
          "updaterank":
            if vbad <> 0 then
              vbad.endsupercharge()
            end if
          "findrank":
            submitone(vsend, [#subject: "sortrank", #content: [#rank: goody.prank]])
          "sortrank":
            if vbad <> 0 then
              vbad.sortranks(data.rank)
              if (string(data.rank) <> EMPTY) and (data.rank <> "Tank Private") then
                goody.feedback(vsend & " promoted: " & data.rank)
                script("ingamefeedback").new(vbad.pos, member("medal"), 1)
              end if
            end if
          "gettime":
            vtime = data
            the itemDelimiter = ":"
            goody.calcsettime(vtime.item[2], vtime.item[3])
          EMPTY:
        end case
      else
        if Msg.subject = "where" then
          if gsubmitstamps = 0 then
            goldtime = integer(Msg.timestamp)
          else
            vdtime = integer(Msg.timestamp) - goldtime
            if (vdtime / gsubmitstamps) < 290 then
              gotoNetPage("http://www.gamevial.com", "_parent")
            end if
          end if
          gsubmitstamps = gsubmitstamps + 1
        else
          if Msg.subject = "dead" then
            if vbad <> 0 then
              vweaplist = [#mine, #gun, #mgun, #bgun, #nook, #rocket, #proximitymine, #speed, #lasergun, #mgunx2, #rocketx4, #remotemine, #sonicgun, #guidedmissile, #thrusters, #mortar, #airstrike, #rcbomb, #rcrocket, #health, #stealth]
              vdesc = [" mines ", " guns ", " guns ", " cannons ", " nooks ", " rockets ", " proximity mines ", " gets ", " lasers ", " twin 73's ", " tankbusts ", " remote mines ", " sonic blasts ", " missiles ", " gets ", " mortars ", " airstrikes ", " remote bombs ", " remote rockets ", " gets ", " gets "]
              vstr = EMPTY
              if vweaplist.getOne(data.typ) > 0 then
                vweap = vweaplist.getOne(data.typ)
                vstr = data.killer & vdesc[vweap] & vsend
              else
                vstr = data.killer & " gets " & vsend
              end if
              if data.killer = "Re play" then
              else
                if data.killer = "Re spawn" then
                  goody.feedback(vsend & " respawns")
                else
                  goody.feedback(vstr)
                end if
              end if
            end if
          end if
        end if
      end if
    end if
  end if
end

on dohurts hurts, nsend
  repeat with vbad in gplayers
    ooch = hurts.getaProp(vbad.pname)
    if ooch > 0 then
      vbad.hurt(ooch, nsend)
    end if
  end repeat
end

on getplayer vnom
  player = 0
  repeat with i = 1 to gplayers.count
    if vnom = gplayers[i].pname then
      player = gplayers[i]
      exit repeat
    end if
  end repeat
  return player
end

on rotinterp rotfromb, rottob, steps
  rotto = rottob
  rotfrom = rotfromb
  actuallyused = vector(0, 0, 0)
  dx = rotto.x - rotfrom.x
  ds = sqrt(dx * dx)
  if ds > 180 then
    if dx > 0 then
      actuallyused.x = (dx - 360) / steps
    else
      actuallyused.x = (dx + 360) / steps
    end if
  else
    actuallyused.x = dx / steps
  end if
  dy = rotto.y - rotfrom.y
  ds = sqrt(dy * dy)
  if ds > 180 then
    if dy > 0 then
      actuallyused.y = (dy - 360) / steps
    else
      actuallyused.y = (dy + 360) / steps
    end if
  else
    actuallyused.y = dy / steps
  end if
  dz = rotto.z - rotfrom.z
  ds = sqrt(dz * dz)
  if ds > 180 then
    if dz > 0 then
      actuallyused.z = (dz - 360) / steps
    else
      actuallyused.z = (dz + 360) / steps
    end if
  else
    actuallyused.z = dz / steps
  end if
  return actuallyused
end

on lobbyin Msg
  grooms = []
  case Msg.subject of
    "ConnectToNetServer":
      if Msg.errorCode <> 0 then
        nom = nom & random(9)
        mus.connectToNetServer([#logonInfo: [#userID: nom, #Password: "password", #movieid: "teamtanks2"], #remoteAddress: mla, #remoteTCPPort: 1626, #encryptionKey: "kwe123eefw3434mwe"])
      end if
    "showgroupcount":
      glinecount = glinecount + 1
      vlistentry = Msg.content.groupName & " "
      repeat with i = vlistentry.char.count to 18
        vlistentry = vlistentry & " "
      end repeat
      if Msg.content.numbermembers < gmaxusers then
        vlistentry = vlistentry & " " & Msg.content.numbermembers & "/" & gmaxusers
      else
        vlistentry = vlistentry & " full"
      end if
      vsct = member("rooms").scrollTop
      member("rooms").line[glinecount] = vlistentry
      member("rooms").color = rgb(255, 255, 255)
      setflash("_root.state", "joinrooms")
      member("rooms").scrollTop = vsct
    EMPTY:
  end case
end

on lobbyframe me
  case gmusmode of
    "start":
      gink = gink + 1
      if gink > 30 then
        gmusmode = "getrooms"
      end if
    "checkrooms":
      Msg = mus.sendNetMessage([#recipients: "system.movie.getGroups", #subject: "checkrooms", #content: EMPTY])
    "getrooms":
      glist = []
      member("rooms").text = EMPTY
      member("rooms").boxType = #fixed
      vroomnos = 10
      if gfilter = "techno" then
        glevellist = ["@techno_1"]
      else
        if gfilter = "artic" then
          glevellist = ["@artic_1"]
        else
          if gfilter = "grass" then
            glevellist = ["@Grass_1", "@Grass_2"]
          else
            if gfilter = "canyon" then
              glevellist = ["@canyon_1", "@canyon_2"]
            else
              if gfilter = "pyramids" then
                glevellist = ["@pyramids_1", "@pyramids_2"]
              else
                if gfilter = "specialops" then
                  vnom = member("datamytank").text
                  the itemDelimiter = ";"
                  vrankpos = integer(vnom.item[1])
                  if vrankpos >= 15 then
                    glevellist = ["@specialops_1"]
                  else
                    alert("Access Restricted. Special Ops rank only- Options/MyTank for achievements to unlock rank.")
                  end if
                else
                  if gfilter = "all" then
                    vroomnos = 10
                    glevellist = ["@Grass_1", "@Grass_2", "@Canyon_1", "@Canyon_2", "@Pyramids_1", "@Pyramids_2", "@Techno_1", "@Artic_1"]
                  else
                    vroomnos = 10
                    glevellist = ["@Grass_1", "@Grass_2", "@Canyon_1", "@Canyon_2", "@Pyramids_1", "@Pyramids_2", "@Techno_1", "@Artic_1"]
                  end if
                end if
              end if
            end if
          end if
        end if
      end if
      repeat with i = 1 to vroomnos
        repeat with t = 1 to glevellist.count
          glist.add(glevellist[t] & "_" & i)
        end repeat
      end repeat
      glinecount = 0
      Msg = mus.sendNetMessage([#recipients: "system.group.getUserCount", #subject: "showgroupcount", #content: glist])
      gmusmode = "joinrooms"
    "joinrooms":
      if not voidp(gmygroup) then
        vleveldata = [[#name: "grass", #size: 180, #height: 0.012, #friction: 0.07000000000000001, #tiletex: "grass", #level: 1], [#name: "canyon", #size: 220, #height: 0.02, #friction: 0.12, #tiletex: "sand", #level: 1], [#name: "pyramids", #size: 180, #height: 0.025, #friction: 0.10000000000000001, #tiletex: "stone", #level: 1], [#name: "artic", #size: 200, #height: 0.025, #friction: 0, #tiletex: "snow", #level: 1], [#name: "specialops", #size: 380, #height: 0.03, #friction: 0.20000000000000001, #tiletex: "asteroid", #level: 1], [#name: "techno", #size: 160, #height: 0.027, #friction: 0.20000000000000001, #tiletex: "circuits", #level: 1]]
        the itemDelimiter = "_"
        v = string(gmygroup.item[1] & "_" & gmygroup.item[2])
        repeat with i = 1 to vleveldata.count
          if gmygroup contains vleveldata[i].name then
            glevel = vleveldata[i]
            exit repeat
          end if
        end repeat
        glevel.setaProp(#level, gmygroup.item[2])
        groompos = gmygroup.item[3]
        gmusmode = "game"
      end if
      gsubmitstamps = 0
    "game":
      mus.setNetMessageHandler(0, me)
      mus.setNetMessageHandler(#incoming, me)
    EMPTY:
  end case
end

on VerifyUserName userName
  naughties = "abcdefghijklmnopqrstuvwxyz1234567890"
  vnam = EMPTY
  repeat with i = 1 to userName.length
    if (naughties contains char i of userName) <> 0 then
      vnam = vnam & char i of userName
    end if
  end repeat
  moo = value("#" & vnam)
  vnam = string(moo)
  if (vnam contains ".") or (vnam = "0") then
    vnam = EMPTY
  end if
  if vnam = EMPTY then
    alert("TAG not allowed, try again.")
  end if
  return vnam
end

on ifuckoff me
  if not voidp(goody) then
    submitmus([#subject: "left", #content: [#killer: "Fear"]])
    mus.sendNetMessage("system.group.leave", EMPTY, gmygroup)
    goody = VOID
  end if
  resetactors()
end
