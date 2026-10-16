property pscore, pkills, pshots_hit, pshots_total, pnukebbq, pubers, pflips, pcaptures, pdamage_to_enemy, pweapaccuracy, pweapaccuracy_hits, pweapaccuracy_shots, pdefends, paccuracy, pscratch, prespawns, pwin, ptopscore, pairtime, ptricksize, ptrickspulled, pSpeed, purl, pnetid, pop
global gmem, goody, gisloggedin, gsession

on new me
  resetstats(me)
  purl = "http://www.gamevial.com/data/gamecomms.php"
  pnetid = 0
  pop = EMPTY
  (the actorList).add(me)
  return me
end

on resetstats me
  pscore = 0
  pkills = 0
  pshots_hit = 0
  pshots_total = 0
  pnukebbq = 0
  pubers = 0
  pflips = 0
  pcaptures = 0
  pdefends = 0
  paccuracy = 0
  pscratch = 0
  prespawns = 0
  pwin = 0
  ptopscore = 0
  pairtime = 0
  ptricksize = 0
  ptrickspulled = 0
  pSpeed = 0
  pdamage_to_enemy = [#mgun: 0, #bgun: 0, #nook: 0, #rocket: 0, #proximitymine: 0, #speed: 0, #lasergun: 0, #mgunx2: 0, #rocketx4: 0, #remotemine: 0, #sonicgun: 0, #guidedmissile: 0, #thrusters: 0, #mortar: 0, #airstrike: 0, #rcbomb: 0, #rcrocket: 0, #health: 0, #stealth: 0]
  pweapaccuracy_hits = [#mgun: 0, #bgun: 0, #nook: 0, #rocket: 0, #proximitymine: 0, #speed: 0, #lasergun: 0, #mgunx2: 0, #rocketx4: 0, #remotemine: 0, #sonicgun: 0, #guidedmissile: 0, #thrusters: 0, #mortar: 0, #airstrike: 0, #rcbomb: 0, #rcrocket: 0, #health: 0, #stealth: 0]
  pweapaccuracy_shots = [#mgun: 0, #bgun: 0, #nook: 0, #rocket: 0, #proximitymine: 0, #speed: 0, #lasergun: 0, #mgunx2: 0, #rocketx4: 0, #remotemine: 0, #sonicgun: 0, #guidedmissile: 0, #thrusters: 0, #mortar: 0, #airstrike: 0, #rcbomb: 0, #rcrocket: 0, #health: 0, #stealth: 0]
  pweapaccuracy = [#mgun: 0, #bgun: 0, #nook: 0, #rocket: 0, #proximitymine: 0, #speed: 0, #lasergun: 0, #mgunx2: 0, #rocketx4: 0, #remotemine: 0, #sonicgun: 0, #guidedmissile: 0, #thrusters: 0, #mortar: 0, #airstrike: 0, #rcbomb: 0, #rcrocket: 0, #health: 0, #stealth: 0]
end

on stepFrame me
  if (pnetid <> 0) and (pop = "mmmpotato") then
    if netDone(pnetid) then
      if netError(pnetid) = "OK" then
        Msg = netTextResult(pnetid)
        the itemDelimiter = ";"
        if Msg.item[1] = "1" then
          vnewrank = Msg.item[2]
          vupdaterank = member("datamytank").text
          the itemDelimiter = ";"
          vupdaterank.item[2] = vnewrank
          member("datamytank").text = vupdaterank
          if not voidp(goody) then
            if goody.pstate = "end" then
              sendSprite(3, #showpromotion, vnewrank)
            end if
          end if
        end if
        pnetid = 0
        pop = EMPTY
      else
        pnetid = 0
        pop = EMPTY
        vresult = "Unable to connect"
      end if
    else
      vresult = "Connecting"
    end if
  end if
end

on die me
  (the actorList).deleteOne(me)
  me = VOID
end

on updatestats me
  vstats = value(member("datastats").text)
  if vstats.max_points < pscore then
    vstats.max_points = pscore
  end if
  if vstats.max_killed < pkills then
    vstats.max_killed = pkills
  end if
  vstats.total_killed = vstats.total_killed + pkills
  repeat with i = 1 to vstats.damage_to_enemy.count
    if integer(vstats.damage_to_enemy.getProp(vstats.damage_to_enemy.getPropAt(i))) < integer(pdamage_to_enemy.getProp(pdamage_to_enemy.getPropAt(i))) then
      vstats.damage_to_enemy[vstats.damage_to_enemy.getPropAt(i)] = integer(pdamage_to_enemy.getProp(pdamage_to_enemy.getPropAt(i)))
    end if
  end repeat
  vstats.total_deaths = vstats.total_deaths + 1
  vstats.total_respawns = vstats.total_respawns + prespawns
  if vstats.max_captures < pcaptures then
    vstats.max_captures = pcaptures
  end if
  vstats.total_captures = vstats.total_captures + pcaptures
  if pwin > 0 then
    vstats.team_wins = vstats.team_wins + 1
  end if
  vstats.battles_fought = vstats.battles_fought = 1
  if vstats.max_airtime < pairtime then
    vstats.max_airtime = pairtime
  end if
  if vstats.max_tricksize < ptricksize then
    vstats.max_tricksize = ptricksize
  end if
  if vstats.max_trickpulled < ptricksize then
    vstats.max_trickpulled = ptrickspulled
  end if
  if vstats.top_speed < pSpeed then
    vstats.top_speed = pSpeed
  end if
  repeat with i = 1 to pweapaccuracy.count
    if pweapaccuracy_shots[pweapaccuracy_shots.getPropAt(i)] > 0 then
      pweapaccuracy[pweapaccuracy.getPropAt(i)] = integer(float(pweapaccuracy_hits[pweapaccuracy_hits.getPropAt(i)]) / pweapaccuracy_shots[pweapaccuracy_shots.getPropAt(i)] * 100)
    end if
  end repeat
  repeat with i = 1 to vstats.accuracy.count
    vstats.accuracy[vstats.accuracy.getPropAt(i)] = integer((float(vstats.accuracy.getProp(vstats.accuracy.getPropAt(i))) + integer(pweapaccuracy.getProp(pweapaccuracy.getPropAt(i)))) / 2)
  end repeat
  if vstats.max_ubers < pubers then
    vstats.max_ubers = pubers
  end if
  vstats.total_ubers = vstats.total_ubers + pubers
  if ptopscore > 0 then
    vstats.award_topscoretimes = vstats.award_topscoretimes + 1
  end if
  vnom = member("datamytank").text
  the itemDelimiter = ";"
  vrank = vnom.item[1]
  vrecruits = vnom.item[3]
  vstats.award_recruits = integer(vrecruits)
  paccuracy = integer(float(pshots_hit) / pshots_total * 100)
  checkpromote(me, vrank, vstats)
end

on checkpromote me, nrank, nstat
  case nrank of
    "Tank Private":
      if (nstat.total_killed >= 20) and (nstat.team_wins >= 2) then
        promote(me, nstat)
      end if
    "Tank Gunner":
      if pnukebbq >= 2 then
        nstat.award_round_challenges[1] = 1
      end if
      if pcaptures >= 5 then
        nstat.award_round_challenges[2] = 1
      end if
      if (nstat.total_killed >= 50) and (nstat.award_round_challenges[1] = 1) and (nstat.award_round_challenges[2] = 1) then
        promote(me, nstat)
      end if
    "Tank Commander":
      if (pubers >= 2) and (pflips >= 20) then
        nstat.award_round_challenges[3] = 1
      end if
      if (nstat.award_round_challenges[3] = 1) and (nstat.total_killed >= 200) and (nstat.max_airtime >= 2000) then
        promote(me, nstat)
      end if
    "Tank Style Technician":
      if (pnukebbq >= 5) and (pdefends >= 5) then
        nstat.award_round_challenges[4] = 1
      end if
      if (nstat.award_round_challenges[4] = 1) and (nstat.total_killed >= 500) and (nstat.award_topscoretimes >= 5) then
        promote(me, nstat)
      end if
    "Tank Captain":
      if (pnukebbq >= 10) and (pscore >= 5000) then
        nstat.award_round_challenges[5] = 1
      end if
      if (nstat.award_round_challenges[5] = 1) and (nstat.award_topscoretimes >= 20) and (nstat.max_airtime >= 40000) then
        promote(me, nstat)
      end if
    "Chief Style Technician":
      vcheck = 0
      repeat with i = 1 to nstat.damage_to_enemy.count
        if integer(nstat.damage_to_enemy.getProp(nstat.damage_to_enemy.getPropAt(i))) > 0 then
          vcheck = vcheck + 1
        end if
      end repeat
      if pscore >= 6000 then
        nstat.award_round_challenges[6] = 1
      end if
      if (vcheck >= 10) and (nstat.award_round_challenges[6] = 1) and (nstat.total_killed >= 1000) then
        promote(me, nstat)
      end if
    "Corporal":
      if (nstat.award_topscoretimes >= 50) and (nstat.award_recruits >= 3) then
        promote(me, nstat)
      end if
    "Sergeant":
      if pscore >= 7000 then
        nstat.award_round_challenges[7] = 1
      end if
      if (nstat.award_round_challenges[7] = 1) and (nstat.total_killed >= 2000) then
        promote(me, nstat)
      end if
    "Gunnery Sergeant":
      if (pscore >= 5000) and (paccuracy >= 90) then
        nstat.award_round_challenges[8] = 1
        promote(me, nstat)
      end if
    "Master Sergeant":
      if pnukebbq >= 50 then
        nstat.award_round_challenges[9] = 1
        promote(me, nstat)
      end if
    "Master Gunnary Sergeant":
      if nstat.total_killed >= 5000 then
        promote(me, nstat)
      end if
    "Sergeant Major":
      if nstat.battles_fought >= 1000 then
        promote(me, nstat)
      end if
    "Veteran":
      if (pscratch <= 0) and (pscore > 5000) and (paccuracy = 95) and (pubers > 5) then
        nstat.award_round_challenges[10] = 1
        promote(me, nstat)
      end if
    "Special Ops":
    EMPTY:
  end case
  member("datastats").text = string(nstat)
  if gisloggedin then
    vcont = ["action": "stats", "game": "teamtanks", "stats": member("datastats").text, "sessionID": gsession]
    postNetText(purl, vcont)
  end if
end

on promote me, nrank
  if gisloggedin then
    pop = "mmmpotato"
    vcont = ["action": "promote", "game": "teamtanks", "sessionID": gsession]
    postNetText(purl, vcont)
  end if
end
