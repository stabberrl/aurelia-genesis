(define (domain aurelia-genesis-world)
  (:requirements :strips :typing)
  (:types cell)
  (:predicates
    (at ?c - cell)
    (adjacent ?from - cell ?to - cell)
    (blocked ?c - cell)
    (consume-target ?c - cell)
    (touch-target ?c - cell)
    (completed))
  (:action move
    :parameters (?from - cell ?to - cell)
    :precondition (and (at ?from) (adjacent ?from ?to) (not (blocked ?to)))
    :effect (and (not (at ?from)) (at ?to)))
  (:action touch
    :parameters (?c - cell)
    :precondition (and (at ?c) (touch-target ?c))
    :effect (completed))
  (:action consume
    :parameters (?c - cell)
    :precondition (and (at ?c) (consume-target ?c))
    :effect (completed)))
