property pmod, pos, bangtime, ptype, ppower, pname, pboomtime, pdis
global gmem, gsmokes, goody, gplayers, gbanglight

on new me, npos, ntyp, nam
  pname = nam
  ptype = string(ntyp)
  pos = npos
  pmod = recyclemodel(#plane)
  if pmod = 0 then
    pmod = planemake()
  end if
  pmod.visibility = #back
  pmod.addToWorld()
  if ptype = "rocket" then
    playsound(npos, "rebangrocketx4")
    pmod.shaderList = recycleshader("bangrocket")
    pmod.transform.position = pos
    ppower = 15
    pmod.transform.scale = vector(1, 1, 1) * ppower * 0.40000000000000002
  else
    if ptype = "guidedmissile" then
      playsound(npos, "rebangrocketx4")
      pmod.shaderList = recycleshader("bangrocket")
      pmod.transform.position = pos
      ppower = 11
      pmod.transform.scale = vector(1, 1, 1) * ppower * 0.40000000000000002
    else
      if ptype = "rocketx4" then
        playsound(npos, "reboom1")
        pmod.shaderList = recycleshader("bangbang")
        pmod.transform.position = pos
        ppower = 25
        pmod.transform.scale = vector(1, 1, 1) * ppower * 1.19999999999999996
      else
        if ptype = "nook" then
          playsound(npos, "renook")
          pmod.shaderList = recycleshader("bangnook")
          pmod.transform.position = pos + vector(0, 0, goody.bsp * 16)
          ppower = 40
          pmod.transform.scale = vector(1, 1, 1) * ppower * 1
        else
          if ptype = "proximitymine" then
            playsound(npos, "reboom1")
            pmod.shaderList = recycleshader("bangmine")
            pmod.transform.position = pos
            ppower = 20
            pmod.transform.scale = vector(1, 1, 1) * ppower * 1.39999999999999991
          else
            if ptype = "remotemine" then
              playsound(npos, "reboom1")
              pmod.shaderList = recycleshader("bangmine")
              pmod.transform.position = pos
              ppower = 15
              pmod.transform.scale = vector(1, 1, 1) * ppower * 1.39999999999999991
            else
              if ptype = "bgun" then
                playsound(npos, "bgunbang")
                pmod.shaderList = recycleshader("bangbgun")
                pmod.transform.position = pos
                ppower = 10
                pmod.transform.scale = vector(1, 1, 1) * ppower * 1
              else
                if ptype = "sonicgun" then
                  playsound(npos, "resonicboom")
                  pmod.shaderList = recycleshader("bangsonic")
                  pmod.transform.position = pos + vector(0, 0, 0)
                  ppower = 8
                  pmod.transform.scale = vector(1, 1, 1) * ppower * 2
                else
                  if ptype = "mortar" then
                    playsound(npos, "rebangmortar")
                    pmod.shaderList = recycleshader("bangairstrike")
                    pmod.transform.position = pos + vector(0, 0, goody.bsp * 1.5)
                    ppower = 14
                    pmod.transform.scale = vector(1, 1, 1) * ppower * 0.5
                  else
                    if ptype = "airstrike" then
                      playsound(npos, "missile_bang")
                      pmod.shaderList = recycleshader("bangairstrike")
                      pmod.transform.position = pos + vector(0, 0, goody.bsp * 6)
                      ppower = 20
                      pmod.transform.scale = vector(1, 1, 1) * ppower * 0.70999999999999996
                    else
                      if ptype = "rcbomb" then
                        playsound(npos, "reboom1")
                        pmod.shaderList = recycleshader("bangmine")
                        pmod.transform.position = pos + vector(0, 0, 0)
                        ppower = 20
                        pmod.transform.scale = vector(1, 1, 1) * ppower * 1
                      else
                        if ptype = "rcrocket" then
                          playsound(npos, "rebangrcrocket")
                          pmod.shaderList = recycleshader("bangmine")
                          pmod.transform.position = pos + vector(0, 0, 0)
                          ppower = 25
                          pmod.transform.scale = vector(1, 1, 1) * ppower * 1.30000000000000004
                        else
                          if ptype = "dead" then
                            playsound(npos, "reboom1")
                            pmod.shaderList = recycleshader("bangdead")
                            pmod.transform.position = pos
                            ppower = 4
                            pmod.transform.scale = vector(1, 1, 1) * ppower * 3
                          end if
                        end if
                      end if
                    end if
                  end if
                end if
              end if
            end if
          end if
        end if
      end if
    end if
  end if
  pmod.shader.emissive = rgb(255, 255, 255)
  pmod.shader.blend = 0
  if ptype = "nook" then
    pdis = 8
    pboomtime = 64
  else
    pdis = 4
    pboomtime = 16
  end if
  pmod.shader.textureTransform.scale = vector(pdis, pdis, pdis)
  if ptype = "nook" then
    pmod.shader.textureTransform.position = vector(0, -7, 0)
  else
    pmod.shader.textureTransform.position = vector(0, -3, 0)
  end if
  pmod.shader.blend = 80
  bangtime = 1
  pmod.parent = gsmokes
  (the actorList).add(me)
  return me
end

on stepFrame me
  if bangtime = 1 then
    if voidp(gbanglight) then
      script("banglight").new(pos, rgb(200, 250, 12), ppower)
    else
      gbanglight.lightup(pos, rgb(200, 250, 12), ppower)
    end if
    if not voidp(goody.pmod) then
      vzone = ppower * 50
      mag = goody.pmod.transform.position.distanceTo(pos)
      if mag < vzone then
        distrat = float(vzone - mag) / vzone
        vforce = distrat * ppower * 200
        if ptype = "sonicgun" then
          vpushforce = vforce * 7
        else
          vpushforce = vforce
        end if
        delta = goody.pmod.transform.position - (pos + vector(0, 0, -5))
        normalize(delta)
        goody.pdummy.applyLinearImpulse(delta * vpushforce, vector(0, 0, 20))
        vouch = vforce * 0.02
        goody.hurt(integer(vouch), pname, ptype)
      end if
      if pname = goody.pname then
        vdam = 0
        repeat with bad in gplayers
          if (bad.pteam <> goody.pteam) and (bad.psuper = 0) and (bad.pspawnprotect = 0) then
            mag = bad.pos.distanceTo(pos)
            if mag < vzone then
              distrat = float(vzone - mag) / vzone
              vforce = distrat * ppower * 200
              vouch = vforce * 0.02
              vdam = vdam + integer(vouch)
            end if
          end if
        end repeat
        goody.scorehurt(vdam)
      end if
    end if
  end if
  pmod.addToWorld()
  pmod.shader.textureTransform.position.x = pmod.shader.textureTransform.position.x - 1
  if pmod.shader.textureTransform.position.x = -pdis then
    pmod.shader.textureTransform.position.x = 0
    pmod.shader.textureTransform.position.y = pmod.shader.textureTransform.position.y + 1
  end if
  dog = goody.pos - pos
  pmod.transform.rotation = goody.pcam.transform.rotation
  bangtime = bangtime + 1
  if bangtime = pboomtime then
    storemodel(#plane, pmod)
    storeshader(pmod.shader)
    (the actorList).deleteOne(me)
  end if
end

on hurt me
end
