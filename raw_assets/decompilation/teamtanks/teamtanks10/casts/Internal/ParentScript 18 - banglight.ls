property plight, bangtime
global gmem, goody, gbanglight

on new me, npos, colour, npower
  bangtime = 5
  if voidp(plight) then
    plight = gmem.newLight("banglight", #point)
    plight.transform.position = npos
    plight.color = colour
    plight.attenuation = vector(0, float(1) / (npower * 0.5 * 10) * 0.5, 0)
    plight.spotDecay = 1
    plight.specular = 0
  end if
  (the actorList).add(me)
  gbanglight = me
  return me
end

on stepFrame me
  if voidp(plight) then
    (the actorList).deleteOne(me)
  else
    if plight.color <> rgb(0, 0, 0) then
      bangtime = bangtime - 1
      if bangtime = 0 then
        plight.color = rgb(0, 0, 0)
      end if
    end if
  end if
end

on lightup me, npos, colour, npower
  bangtime = 5
  plight.transform.position = npos
  plight.attenuation = vector(0, float(1) / (npower * 0.5 * 10) * 0.5, 0)
  plight.color = colour
end
