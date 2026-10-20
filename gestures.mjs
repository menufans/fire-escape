// Block browser zoom only while the game is accepting play input.
// Pointer events remain independent for simultaneous joystick + camera fingers.
export function installGestureGuards(root,isPlaying){
 const prevent=e=>{if(isPlaying()&&e.cancelable)e.preventDefault()};
 const multi=e=>{if(e.touches?.length>1)prevent(e)};
 const wheel=e=>{if(e.ctrlKey)prevent(e)};
 const registrations=[['gesturestart',prevent],['gesturechange',prevent],['dblclick',prevent],['touchmove',multi],['wheel',wheel]];
 for(const [type,listener]of registrations)root.addEventListener(type,listener,{passive:false,capture:true});
 return()=>{for(const[type,listener]of registrations)root.removeEventListener(type,listener,{capture:true})};
}
