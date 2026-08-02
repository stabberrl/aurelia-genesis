(define (problem aurelia-default-seed-energy-source)
  (:domain aurelia-grid-phase0)
  (:objects
    c1-1 c2-1 c3-1 c4-1 c5-1 c6-1 c7-1 c8-1 c9-1
    c1-2 c2-2 c3-2 c4-2 c5-2 c6-2 c7-2 c8-2 c9-2
    c1-3 c2-3 c3-3 c4-3 c5-3 c6-3 c7-3 c8-3 c9-3
    c1-4 c2-4 c3-4 c4-4 c5-4 c6-4 c7-4 c8-4 c9-4
    c1-5 c2-5 c3-5 c4-5 c5-5 c6-5 c7-5 c8-5 c9-5
    c1-6 c2-6 c3-6 c4-6 c5-6 c6-6 c7-6 c8-6 c9-6
    c1-7 c2-7 c3-7 c4-7 c5-7 c6-7 c7-7 c8-7 c9-7 - cell)
  (:init
    (at c2-4) (energy-source c8-4)
    (blocked c5-3) (blocked c5-4) (blocked c5-5)
    (adjacent c2-4 c2-3) (adjacent c2-3 c2-4) (adjacent c2-3 c3-3) (adjacent c3-3 c2-3)
    (adjacent c3-3 c3-2) (adjacent c3-2 c3-3) (adjacent c3-2 c4-2) (adjacent c4-2 c3-2)
    (adjacent c4-2 c5-2) (adjacent c5-2 c4-2) (adjacent c5-2 c6-2) (adjacent c6-2 c5-2)
    (adjacent c6-2 c7-2) (adjacent c7-2 c6-2) (adjacent c7-2 c8-2) (adjacent c8-2 c7-2)
    (adjacent c8-2 c8-3) (adjacent c8-3 c8-2) (adjacent c8-3 c8-4) (adjacent c8-4 c8-3))
  (:goal (consumed)))
