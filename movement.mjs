export const WALK_SPEED=2.9,RUN_SPEED=5.3,CROUCH_SPEED=1.45;
export function locomotion({x=0,z=0,joystickMagnitude=0,crouched=false,shift=false}={}){const moving=Math.hypot(x,z)>.08;const running=moving&&!crouched&&(joystickMagnitude>.82||shift);return{moving,running,speed:crouched?CROUCH_SPEED:running?RUN_SPEED:WALK_SPEED}}
