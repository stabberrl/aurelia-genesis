(define (domain aurelia-grid-phase0)
  (:requirements :strips :typing)
  (:types cell)
  (:predicates
    (at ?c - cell)
    (adjacent ?from - cell ?to - cell)
    (blocked ?c - cell)
    (energy-source ?c - cell))
  (:action move
    :parameters (?from - cell ?to - cell)
    :precondition (and (at ?from) (adjacent ?from ?to) (not (blocked ?to)))
    :effect (and (not (at ?from)) (at ?to))))
