import { Blockly, OPCODES } from '.';

export class ashConnectionChecker extends Blockly.ConnectionChecker {
    override doDragChecks(
        a: Blockly.RenderedConnection,
        b: Blockly.RenderedConnection,
        distance: number,
    ): boolean {
        const input = b.getParentInput();

        if (input?.name === 'INDEX' && input.getSourceBlock().type === OPCODES.repeatTimes) {
            return false;
        }

        return super.doDragChecks(a, b, distance);
    }
}
