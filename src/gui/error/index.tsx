// 错误界面

import { t } from 'i18next';
import type { IFailedReason } from '../../types/failed';

const Error = (props: { reason: IFailedReason }) => {
    return <span>{t(props.reason)}</span>;
};

export default Error;
