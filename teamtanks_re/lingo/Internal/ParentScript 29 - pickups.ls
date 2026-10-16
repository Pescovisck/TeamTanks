property pos, prot, pmod, pstate, pmax, ptype, pid, pstartpos, plocked
global gmem, gsmokes, goody

on new me, npos, nrot, nid, ntype, nlocked, nramp
  (the actorList).add(me)
  ptype = ntype
  if voidp(nlocked) then
    nlocked = 1
  end if
  plocked = nlocked
  pid = nid
  if nramp = "ramp1" then
    vup = 200
    vfor = 140
  else
    if nramp = "ramp2" then
      vup = 460
      vfor = 420
    else
      if nramp = "ramp3" then
        vup = 250
        vfor = 320
      else
        if nramp = "loop" then
          vup = 410
          vfor = 0
        else
          if nramp = "twist" then
            vup = 10
            vfor = 1
          else
            vup = 20
            vfor = 0
          end if
        end if
      end if
    end if
  end if
  pos = npos + vector(0, 0, vup)
  pos = pos - (angtovec(nrot + vector(0, 0, 90)) * vfor)
  pstate = 1
  pmod = recyclemodel(#plane)
  if pmod = 0 then
    pmod = planemake()
  end if
  if voidp(gmem.shader("t" & ptype)) then
    vtexs = ["mgun", "bgun", "nook", "rocket", "proximitymine", "speed", "lasergun", "mgunx2", "rocketx4", "remotemine", "sonicgun", "guidedmissile", "thrusters", "mortar", "airstrike", "rcbomb", "rcrocket", "health", "stealth"]
    if vtexs.getOne(ptype) <> 0 then
      if plocked = 1 then
        member("icons").posterFrame = integer(vtexs.getOne(ptype))
      else
        if plocked = 0 then
          member("icons").posterFrame = integer(vtexs.getOne(ptype) + vtexs.count)
        end if
      end if
    end if
    ns = gmem.newShader("t" & ptype, #standard)
    ns.texture = gmem.newTexture("t" & ptype, #fromCastMember, member("icons"))
    ns.texture.renderFormat = #rgba8888
  end if
  pmod.transform.rotation = vector(90, 0, 0)
  pmod.rotate(vector(0, random(180), 0), #self)
  pmod.transform.scale = vector(1, 1, 1) * 2
  pmod.transform.position = pos
  pstartpos = pos
  pmod.visibility = #both
  pmod.shaderList = gmem.shader("t" & ptype)
  pmod.shader.emissive = rgb(255, 255, 255)
  pmod.shader.shininess = 0
  pmod.parent = gsmokes
end

on distboy me
  if not voidp(goody.weaponry) then
    if (goody.pos.distanceTo(pos) < (goody.bsp * 2)) and (goody.weaponry.premote = VOID) then
      vrefresh = 0
      playsound(pos, "reload", 7)
      case ptype of
        "mgun":
          vweapons = [#mgun: 80]
          vpweapon = #mgun
        "bgun":
          vweapons = [#bgun: 6]
          vpweapon = #bgun
        "nook":
          vweapons = [#nook: 1]
          vpweapon = #nook
        "rocket":
          vweapons = [#rocket: 4]
          vpweapon = #rocket
        "proximitymine":
          vweapons = [#proximitymine: 5]
          vpweapon = #proximitymine
        "speed":
          vweapons = [#speed: 100]
          vpweapon = #speed
        "lasergun":
          vweapons = [#lasergun: 120]
          vpweapon = #lasergun
        "mgunx2":
          vweapons = [#mgunx2: 80]
          vpweapon = #mgunx2
        "rocketx4":
          vweapons = [#rocketx4: 2]
          vpweapon = #rocketx4
        "remotemine":
          vweapons = [#remotemine: 3]
          vpweapon = #remotemine
        "sonicgun":
          vweapons = [#sonicgun: 4]
          vpweapon = #sonicgun
        "guidedmissile":
          vweapons = [#guidedmissile: 3]
          vpweapon = #guidedmissile
        "thrusters":
          vweapons = [#thrusters: 400]
          vpweapon = #thrusters
        "mortar":
          vweapons = [#mortar: 5]
          vpweapon = #mortar
        "airstrike":
          vweapons = [#airstrike: 1]
          vpweapon = #airstrike
        "rcbomb":
          vweapons = [#rcbomb: 1000]
          vpweapon = #rcbomb
        "rcrocket":
          vweapons = [#rcrocket: 1200]
          vpweapon = #rcrocket
        "health":
          vweapons = [#health: 3]
          vpweapon = #health
        "stealth":
          vweapons = [#stealth: 250]
          vpweapon = #stealth
        EMPTY:
      end case
      goody.weapons = vweapons
      goody.pweapon = vpweapon
      goody.chambers = goody.weapons.duplicate()
      vpos = goody.weaponry.pweaplist.getOne(goody.pweapon)
      vpickdescs = ["73mm gun", "720mm gun", "Tactical Nuke", "Rocket", "Proximity Mine", "Speed Boost", "Laser Gun", "Twin 73's", "Tankbuster", "Remote Mine", "Sonic Blaster", "Guided Missile", "Jet Pack", "Mortars", "Air Strike", "Remote Bomb", "Remote Rocket", "Repair Pack", "Stealth Cloak"]
      vfeed = script("ingamefeedback").new(goody.pos, "*" & vpickdescs[vpos] & "*", 1)
      goody.weaponry.reload(ptype)
      pstate = 0
    end if
  end if
end

on stepFrame me
  if not voidp(goody) then
    prot = prot + 2
    pmod.rotate(vector(0, 5, 0), #self)
    if pstate = 1 then
      if plocked = 1 then
        distboy(me)
        pmax = prot
      end if
    else
      vsca = 2 - ((prot - pmax) * 0.10000000000000001)
      if vsca > 0 then
        pmod.transform.scale = vector(vsca, vsca, vsca)
        pmod.transform.position = pmod.transform.position + ((goody.pos - pmod.transform.position) * 0.5)
      else
        pmod.visibility = #none
      end if
      if prot > (pmax + 500) then
        pstate = 1
        pmod.transform.scale = vector(1, 1, 1) * 2
        pmod.transform.position = pstartpos
        pmod.visibility = #both
      end if
    end if
  else
    die(me)
  end if
end

on die me
  storemodel(#plane, pmod)
  (the actorList).deleteOne(me)
end
