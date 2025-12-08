import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
// @mui
import { List, Stack, Button, Collapse } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { browserName } from 'react-device-detect';
import { StyledSubheader } from './styles';

// ----------------------------------------------------------------------

NavSectionVertical.propTypes = {
  data: PropTypes.array,
};

export default function NavSectionVertical({ data, ...other }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(()=>{
    if(pathname.split('/').length > 3){
      setOpen(true);
    }
  },[pathname])

  const handleCollapseClick = (length, path, title) => {
    navigate(path);
    if (length) setOpen(!open);
    if(!pathname.includes(title?.toLowerCase())) setOpen(!open);
  };

  return (
    <Stack sx={{pt:2}} {...other} alignItems={'flex-start'}>
      {data.map((group) => {
        const key = group?.title || group.items[0].title;
        return (
          <List key={key} disablePadding sx={{ px: 2, pt: 1, }}>
            {group?.title && <StyledSubheader disableSticky active={group?.path?.includes(pathname) ? 'true' : undefined} onClick={() => handleCollapseClick(group?.children?.length, group?.path, group?.title)}>{group?.title}</StyledSubheader>}

            {group?.children?.map((list,i) => (
              <Collapse in={open}>
                <Stack key={i} flexDirection={'column'} alignItems={'flex-start'}>
                  <List key={list?.title} disablePadding sx={{ px: 2, pt: 2, }}>
                    <Button onClick={() => {
                      navigate(list?.path);
                    }
                    } variant="text" style={{ textDecoration: (list?.path?.includes(pathname)) ? 'underline':'none', color: "#fff", fontSize : '12px', lineHeight : 1, fontWeight : 700 }}>
                      {list?.title}
                    </Button>
                  </List>
                </Stack>
              </Collapse>
            ))}
          </List>
        );
      })}
    </Stack>
  );
}
