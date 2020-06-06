import React, { useRef } from 'react';
import { Synth } from "tone";


const Note = ({ note, black, noteValue }) => {
    const synth = new Synth().toMaster();
    const blackNoteRef = useRef();
    const noteRef = useRef();


    const noteDown = (e, key) => {
        console.log('key', key)
        key.style.background = black ? "#4682B4" : "#87CEEB";
        synth.triggerAttackRelease(noteValue, '4n');
        e.stopPropagation();
    }

    const noteUp = key => {
        key.style.background = "white";
    }

    return (
        <div 
            ref={noteRef} 
            className="whitenote" 
            onMouseOver={e => noteDown(e, noteRef.current)}
            onMouseLeave={() => noteUp(noteRef.current)}
        >
            {black && 
                <div 
                    ref={blackNoteRef} 
                    className="blacknote"
                    // onMouseOver={e => noteDown(e, noteRef.current)}
                    // onMouseLeave={() => noteUp(blackNoteRef.current)}
                    >{note}
                </div>}
            {note}
        </div>
    )
}

const Piano = () => {
    const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

    const board = () => {
        for(let octave = 0; octave < 4; octave++){
            return notes.map(note => {
                if(note != 'E' && note != 'B') {
                    return <Note 
                            key={`${note}--${octave}`} 
                            noteValue={note + '#' + (octave+4)}
                            black note={note} 
                        />
                }
                return <Note 
                    key={`${note}--${octave}`} 
                    noteValue={note + (octave+4)} 
                    note={note} 
                />
            })
        }
    }
    
    
    return (
        <div className="piano">{board()}</div>
    )
}

export default Piano;
