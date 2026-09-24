import { Box } from '../box';

export const Editor = () => {
    return (
        <div>
            <Box tip='hello'>tip align is pointer!</Box>
            <Box tip='hello123' tipPosition='dom'>tip align is dom!</Box>
        </div>
    );
};
