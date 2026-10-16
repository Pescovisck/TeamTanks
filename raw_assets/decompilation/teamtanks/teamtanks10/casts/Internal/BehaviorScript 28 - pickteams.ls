property pbother, pteam
global gteam, gteamok, gteambalancer, goody, gmem, govlist, gtaglist, gplayers

on beginSprite me
  if me.spriteNum = 3 then
    pteam = "red"
  else
    pteam = "blue"
  end if
end

on exitFrame me
  vbother = pbother
  if gteamok.getOne(pteam) <> 0 then
    pbother = 1
    sprite(me.spriteNum).cursor = 280
  else
    pbother = 0
    sprite(me.spriteNum).cursor = -1
  end if
  if vbother <> pbother then
    gteambalancer.updateoverlays()
  end if
end

on mouseUp me
  if pbother then
    gteam = pteam
    repeat with bad in gplayers
      bad.setaProp(#phavoverlay, 0)
    end repeat
    vcount = gmem.camera(1).overlay.count
    repeat with i = 1 to vcount
      gmem.camera(1).removeOverlay(1)
    end repeat
    govlist = []
    gtaglist = []
    goody.prep()
    go("play")
  end if
end
