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

  // A single state variable to hold the 'title' of the currently active/selected top-level item
  const [activeGroupTitle, setActiveGroupTitle] = useState(null);

  // Use an effect to set the initial active group on load/reload based on the URL
  useEffect(() => {
    // Find the group that matches the current pathname exactly or as a prefix for its children
    const currentActiveGroup = data.find(group => {
        const matchesExactPath = group.path === pathname;
        const matchesChildPath = group.children && group.children.some(child => pathname.startsWith(child.path));
        return matchesExactPath || matchesChildPath;
    });

    if (currentActiveGroup) {
      setActiveGroupTitle(currentActiveGroup.title);
    }
  }, [pathname, data]); // Rerun this effect if path or data changes

  const handleNavigation = (path, title) => {
    if (path) {
      navigate(path);
      // When navigating, update the global active group title
      setActiveGroupTitle(title);
    }
  };

  return (
    <Stack sx={{ pt: 2 }} {...other} alignItems={'flex-start'}>
      {data.map((group) => {
        const key = group.title;
        const hasChildren = group.children && group.children.length > 0;
        
        // This group is open IF its title matches the globally active title
        const isGroupOpen = activeGroupTitle === group.title; 

        return (
          <List key={key} disablePadding sx={{ px: 2, pt: 1 }}>
            
            {/* Top Level Item/Header (Always visible) */}
            <StyledSubheader
              disableSticky
              active={isGroupOpen ? 'true' : undefined} 
              onClick={() => {
                // When clicked, make this the active group and navigate
                handleNavigation(group.path, group.title);
              }}
            >
              {group.title}
            </StyledSubheader>

            {/* Collapsible Children Section (Only renders if hasChildren is true) */}
            {hasChildren && (
              <Collapse in={isGroupOpen}>
                <Stack flexDirection={'column'} alignItems={'flex-start'}>
                  {group.children.map((childItem) => (
                    <List key={childItem.title} disablePadding sx={{ px: 2, pt: 2 }}>
                      <Button
                        onClick={() => handleNavigation(childItem.path, group.title)}
                        variant="text"
                        style={{
                          textDecoration: (childItem.path === pathname) ? 'underline' : 'none',
                          color: "#fff",
                          fontSize: '12px',
                          lineHeight: 1,
                          fontWeight: 700
                        }}
                      >
                        {childItem.title}
                      </Button>
                    </List>
                  ))}
                </Stack>
              </Collapse>
            )}
          </List>
        );
      })}
    </Stack>
  );
}
