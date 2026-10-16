property pspr, pmem, scrb, mousein
global mus, gmusmode, gmaxusers, gmygroup, gScreenRect, gScreenDepth

on beginSprite me
  pspr = sprite(me.spriteNum)
  pmem = pspr.member
  scrb = pspr.right
  pspr.visible = 0
  _player.cursor(-1)
end

on exitFrame me
  if mousein = 1 then
    lineNum = pspr.pointToLine(the mouseLoc)
    pmem.color = rgb(255, 255, 255)
    if lineNum > 0 then
      if not voidp(pmem.line[lineNum]) then
        pmem.line[lineNum].color = rgb(255, 255, 0)
      end if
    end if
  end if
end

on mouseDown me
  if (the mouseLoc).locH < scrb then
    lineNum = pspr.pointToLine(the mouseLoc)
    tmp = pspr.member.line[lineNum]
    if tmp.word[2] = "full" then
      alert("Level full, please choose another")
    else
      gmygroup = tmp.word[1]
      errCode = mus.sendNetMessage("system.group.join", EMPTY, gmygroup)
    end if
  end if
  cursor(-1)
end

on mouseEnter me
  mousein = 1
  cursor(280)
end

on mouseLeave me
  mousein = 0
  pmem.color = rgb(255, 255, 255)
  cursor(-1)
end
