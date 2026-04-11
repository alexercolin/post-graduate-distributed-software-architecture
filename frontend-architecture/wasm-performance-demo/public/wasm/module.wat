(module
 (type $0 (func (param i32 i32 f64 f64 f64 i32 i32)))
 (type $1 (func (param i32) (result i64)))
 (type $2 (func))
 (memory $0 0)
 (export "computeMandelbrot" (func $assembly/mandelbrot/computeMandelbrot))
 (export "fibonacci" (func $assembly/fibonacci/fibonacci))
 (export "memory" (memory $0))
 (export "_start" (func $~start))
 (func $assembly/mandelbrot/computeMandelbrot (param $0 i32) (param $1 i32) (param $2 f64) (param $3 f64) (param $4 f64) (param $5 i32) (param $6 i32)
  (local $7 f64)
  (local $8 f64)
  (local $9 i32)
  (local $10 i32)
  (local $11 i32)
  (local $12 f64)
  (local $13 f64)
  (local $14 f64)
  f64.const 4
  local.get $0
  f64.convert_i32_s
  local.get $4
  f64.mul
  f64.div
  local.set $12
  loop $for-loop|0
   local.get $1
   local.get $11
   i32.gt_s
   if
    i32.const 0
    local.set $9
    loop $for-loop|1
     local.get $0
     local.get $9
     i32.gt_s
     if
      local.get $2
      local.get $9
      f64.convert_i32_s
      local.get $0
      f64.convert_i32_s
      f64.const 0.5
      f64.mul
      f64.sub
      local.get $12
      f64.mul
      f64.add
      local.set $13
      local.get $3
      local.get $11
      f64.convert_i32_s
      local.get $1
      f64.convert_i32_s
      f64.const 0.5
      f64.mul
      f64.sub
      local.get $12
      f64.mul
      f64.add
      local.set $14
      f64.const 0
      local.set $4
      f64.const 0
      local.set $8
      i32.const 0
      local.set $10
      loop $while-continue|2
       local.get $5
       local.get $10
       i32.gt_s
       if (result i32)
        local.get $4
        local.get $4
        f64.mul
        local.get $8
        local.get $8
        f64.mul
        f64.add
        f64.const 4
        f64.le
       else
        i32.const 0
       end
       if
        local.get $4
        local.get $4
        f64.mul
        local.get $8
        local.get $8
        f64.mul
        f64.sub
        local.get $13
        f64.add
        local.set $7
        local.get $4
        local.get $4
        f64.add
        local.get $8
        f64.mul
        local.get $14
        f64.add
        local.set $8
        local.get $7
        local.set $4
        local.get $10
        i32.const 1
        i32.add
        local.set $10
        br $while-continue|2
       end
      end
      local.get $6
      local.get $0
      local.get $11
      i32.mul
      local.get $9
      i32.add
      i32.const 2
      i32.shl
      i32.add
      local.get $5
      local.get $10
      i32.eq
      if (result i32)
       i32.const -16777216
      else
       f64.const 1
       local.get $10
       f64.convert_i32_s
       local.get $5
       f64.convert_i32_s
       f64.div
       local.tee $4
       f64.sub
       local.tee $7
       f64.const 9
       f64.mul
       local.get $4
       f64.mul
       local.get $4
       f64.mul
       local.get $4
       f64.mul
       f64.const 255
       f64.mul
       i32.trunc_sat_f64_u
       i32.const 255
       i32.and
       local.get $7
       f64.const 8.5
       f64.mul
       local.get $7
       f64.mul
       local.get $7
       f64.mul
       local.get $4
       f64.mul
       f64.const 255
       f64.mul
       i32.trunc_sat_f64_u
       i32.const 255
       i32.and
       i32.const 16
       i32.shl
       i32.const -16777216
       i32.or
       local.get $7
       f64.const 15
       f64.mul
       local.get $7
       f64.mul
       local.get $4
       f64.mul
       local.get $4
       f64.mul
       f64.const 255
       f64.mul
       i32.trunc_sat_f64_u
       i32.const 255
       i32.and
       i32.const 8
       i32.shl
       i32.or
       i32.or
      end
      i32.store
      local.get $9
      i32.const 1
      i32.add
      local.set $9
      br $for-loop|1
     end
    end
    local.get $11
    i32.const 1
    i32.add
    local.set $11
    br $for-loop|0
   end
  end
 )
 (func $assembly/fibonacci/fibonacci (param $0 i32) (result i64)
  local.get $0
  i32.const 1
  i32.le_s
  if
   local.get $0
   i64.extend_i32_s
   return
  end
  local.get $0
  i32.const 1
  i32.sub
  call $assembly/fibonacci/fibonacci
  local.get $0
  i32.const 2
  i32.sub
  call $assembly/fibonacci/fibonacci
  i64.add
 )
 (func $~start
 )
)
