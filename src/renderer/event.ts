export interface NumberInputEvent extends InputEvent{
    target: HTMLInputElement
}
export interface TextInputEvent extends InputEvent {
    target: HTMLInputElement
}

// This is used becuase the types in the input event dont go that deep
// and typescript throws an error if you do 'e.target.value'
export interface TargetedInputEvent extends InputEvent {
    target: HTMLInputElement
}

