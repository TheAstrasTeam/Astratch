/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box } from '../../Box';
import { Modal } from '../../Modal/modalWindow';
import styles from './index.module.scss';

export const CreateToolTipModal = () => {
    const markdown = `
*Start with Ideas, Reach for Stars.*

Astratch by **The Astras Team**

\`\`\` ash
@event_lifecycle_onStart;
@entity_transform_position_moveStep(10);
@entity_appearance_images_showImage("hello world");
@entity_transform_layer_setLayer(@entity_transform_layer_getLayer);
@control_flow_waitUntil(@operator_logic_compare(1, <, 2));
@entity_transform_position_moveStep($score);
@control_condition_if( {
    @entity_transform_position_moveStep(1);
    @entity_appearance_images_showImage("hello world");
}, {
    @control_flow_waitUntil(!s_false);
});
\`\`\`

    `;

    const html = `
<div style="
    display: flex;
    flex-direction: column;
    align-items: center;
">
<span style="font-size: 24px">Astratch</span>
<hr style="border-color: #0099ff"/>
<p style="font-style: italic">Start with Ideas, Reach for Stars.</p>
</div>
`;

    return (
        <Modal windowID='toolTipTest' fullScreen={false} minWidth={0} minHeight={0} title='test'>
            <div className={styles.content}>
                <Box title={markdown} titleType='markdown'>
                    Markdown
                </Box>
                <br />
                <Box title={html} titleType='dom'>
                    HTML
                </Box>
                <br />
                <Box title='Start with Ideas, Reach for Stars.' titleType='dom'>
                    Text
                </Box>
            </div>
        </Modal>
    );
};
