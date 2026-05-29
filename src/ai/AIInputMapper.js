export class AIInputMapper {
    constructor(aiController) {
        this.ai = aiController;
    }
    isKeyPressed(action) {
        // console.log(this.ai.commands);
        return this.ai.commands[action] === true;
    }
}