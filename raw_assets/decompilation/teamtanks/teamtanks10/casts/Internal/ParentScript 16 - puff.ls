property pmod, plifetime, ptyp, pSize, ptail
global gmem, goody, gsmokes

on new me, npos, ntyp
  pos = npos
  pmod = recyclemodel(#plane)
  if pmod = 0 then
    pmod = planemake()
  end if
  ptyp = ntyp
  pmod.visibility = #back
  if ptyp = "impulse" then
    pSize = 0.05
    ptail = 30
    pmod.shaderList = recycleshader("sonic", 1)
  else
    if ptyp = "rcrocket" then
      pSize = 0.10000000000000001
      ptail = 10
      pmod.shaderList = recycleshader("pufft", 1)
    else
      if ptyp = "rocketx4" then
        pSize = 0.20000000000000001
        ptail = 20
        pmod.shaderList = recycleshader("pufft", 1)
      else
        pSize = 0.20000000000000001
        ptail = 10
        pmod.shaderList = recycleshader("pufft", 1)
      end if
    end if
  end if
  pmod.shader.emissive = rgb(255, 255, 255)
  pmod.shader.blend = 100
  pmod.transform.scale = vector(0.01, 0.01, 0.01)
  pmod.transform.position = pos
  if not voidp(goody) then
    pmod.transform.rotation = goody.pcam.transform.rotation
  end if
  pmod.rotate(vector(0, 0, random(36) * 10), #self)
  pmod.shader.textureTransform.scale = vector(1, 1, 1)
  plifetime = 0
  pmod.parent = gsmokes
  (the actorList).add(me)
  return me
end

on stepFrame me
  plifetime = plifetime + 1
  pmod.shader.blend = 100 - ((float(plifetime) / ptail * 100) - 1)
  pmod.transform.scale = plifetime * vector(1, 1, 1) * pSize
  if plifetime > ptail then
    hurt(me)
  end if
end

on hurt me
  storemodel(#plane, pmod)
  storeshader(pmod.shader)
  (the actorList).deleteOne(me)
  me = VOID
end
