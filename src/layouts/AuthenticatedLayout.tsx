import Sidebar from '../components/Sidebar';
import { AppBar, Box, IconButton, Switch, Toolbar, Typography } from '@mui/material';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import { Route, Routes } from 'react-router-dom';
import UrlsPage from '../pages/UrlsPage';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import NotFoundPage from '../pages/NotFoundPage.tsx';
import UserInfoPage from '../pages/UserInfoPage.tsx';
import { UserInfoDto } from '../model/users.ts';
import OrganizationSettingsPage from '../pages/OrganizationSettingsPage.tsx';
import { OrganizationDto, OrganizationsListDto } from '../model/organizations.ts';
import config from '../config/config.ts';
import { ApiClient } from '../common/api.ts';
import { ErrorResponseElement } from '../model/common.ts';
import * as _ from 'lodash';
import OrganizationMembersPage from '../pages/OrganizationMembersPage.tsx';
import ShortUrlStatsPage from '../pages/ShortUrlStatsPage.tsx';
import { hasRole } from '../auth/auth.ts';
import { MemberRole } from '../model/auth.ts';
import { useAppToast } from '../components/toast.tsx';

export interface AuthenticatedLayoutProps {
    darkMode: boolean;
    setDarkMode: Dispatch<SetStateAction<boolean>>;
}

const AuthenticatedLayout = ({ darkMode, setDarkMode }: AuthenticatedLayoutProps) => {
    const [user, setUser] = useState<UserInfoDto | null>(null);
    const [currentOrg, setCurrentOrg] = useState<OrganizationDto | null>(null);
    const [organizations, setOrganizations] = useState<OrganizationDto[] | null>(null);

    const { error } = useAppToast();

    useEffect(() => {
        (async () => {
            const slug = localStorage.getItem(config.currentOrganizationSlugKey)!;
            const res: OrganizationDto | ErrorResponseElement =
                await ApiClient.getOrganizationBySlug(slug);

            if (_.has(res, 'errorType')) {
                error('Could not get current organization info');
                return;
            }

            const payload: OrganizationDto = res as OrganizationDto;
            setCurrentOrg(payload);
        })();

        (async () => {
            const res: OrganizationsListDto | ErrorResponseElement =
                await ApiClient.getUserOrganizations({ q: 10000 });
            if (_.has(res, 'errorType')) {
                error("Could not get participating organizations' info");
                return;
            }
            const { entries }: OrganizationsListDto = res as OrganizationsListDto;
            setOrganizations(entries);
        })();
    }, [setCurrentOrg, setOrganizations]);

    return (
        <Box
            sx={{
                position: 'relative',
                minHeight: '100vh',
                bgcolor: 'transparent',
                overflow: 'hidden',
                display: 'flex',
            }}
        >
            <Sidebar user={user} setUser={setUser} org={currentOrg} orgs={organizations} />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 0,
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: 'transparent',
                }}
            >
                <AppBar position="static" elevation={0} style={{ borderLeft: 'none' }}>
                    <Toolbar>
                        <Typography variant="h5" sx={{ flexGrow: 1 }}>
                            Shortener Dashboard
                        </Typography>
                        <IconButton onClick={() => setDarkMode((v) => !v)} color="inherit">
                            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                        </IconButton>
                        <Switch
                            checked={darkMode}
                            onChange={() => setDarkMode((v) => !v)}
                            color="secondary"
                        />
                    </Toolbar>
                </AppBar>

                <Box
                    sx={{
                        px: 3,
                        backgroundColor: 'transparent',
                    }}
                >
                    <Routes>
                        <Route path={'/urls'} element={<UrlsPage />} />
                        {(hasRole(MemberRole.ORGANIZATION_OWNER) ||
                            hasRole(MemberRole.ORGANIZATION_ADMIN) ||
                            hasRole(MemberRole.ORGANIZATION_URLS_MANAGER)) && (
                            <Route path={'/urls/:urlId'} element={<ShortUrlStatsPage />} />
                        )}
                        <Route path={'/members'} element={<OrganizationMembersPage />} />
                        {(hasRole(MemberRole.ORGANIZATION_OWNER) ||
                            hasRole(MemberRole.ORGANIZATION_MANAGER) ||
                            hasRole(MemberRole.ORGANIZATION_ADMIN)) && (
                            <Route
                                path={'/organization'}
                                element={
                                    <OrganizationSettingsPage
                                        org={currentOrg}
                                        setOrg={setCurrentOrg}
                                        setOrgs={setOrganizations}
                                    />
                                }
                            />
                        )}
                        <Route
                            path={'/account'}
                            element={<UserInfoPage user={user} setUser={setUser} />}
                        />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Box>
            </Box>
        </Box>
    );
};

export default AuthenticatedLayout;
