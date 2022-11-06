import {Box, InputAdornment, TextField} from "@mui/material";
import React, {useEffect, useState} from "react";
import SearchIcon from "@mui/icons-material/Search";
// import videos from "./DummyData.json";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Fab from "@mui/material/Fab";
import NavBar from "../components/common";
import {useNavigate} from "react-router-dom";

import * as home from "../static/home.css";

interface Column {
    id: "name" | "uploader" | "dateUploaded";
    label: string;
    minWidth?: number;
    align?: "right";
}

interface VideoList {
    filteredList: Array<Video | undefined>;
}

const columns: readonly Column[] = [
    {id: "name", label: "Video Title", minWidth: 170},
    {id: "uploader", label: "Uploaded By", minWidth: 170},
    {id: "dateUploaded", label: "Date Uploaded", minWidth: 170}
];



const VideoList = ({filteredList}: VideoList): JSX.Element => {
    //https://mui.com/material-ui/react-table/
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const navigate = useNavigate();

    const routeChange = (key:string) => {
        const path = `/video/${key}`;
        navigate(path);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };
    return (
        <Paper sx={{width: "100%", overflow: "hidden"}}>
            <TableContainer sx={{maxHeight: 600}}>
                <Table stickyHeader aria-label="videos">
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell key={column.id} style={{minWidth: column.minWidth}}>
                                    <b>{column.label}</b>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredList
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row) => {
                                if (row === undefined) {
                                    throw undefined;
                                }
                                return (
                                    <TableRow
                                        hover
                                        role="checkbox"
                                        onClick={() => routeChange(row["name"])}
                                        tabIndex={-1}
                                        key={row.id}
                                    >
                                        {columns.map((column) => {
                                            let value;

                                            if (column.id === "uploader") {
                                                value = row[column.id].email;
                                            } else if (column.id === "dateUploaded") {
                                                value = row[column.id].toLocaleDateString();
                                            } else {
                                                value = row[column.id];
                                            }
                                            return <TableCell key={column.id}>{value}</TableCell>;
                                        })}
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 100]}
                component="div"
                count={filteredList.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    );
};

export default function HomePage() {
    const [videosList, setVideosList] = useState<Array<Video | undefined>>([]);
    const [filteredList, setFilteredList] = useState<Array<Video | undefined>>([]);

    function getVideos(): (Video | undefined)[] {
        function getTypeAsLiteral(type: string) {
            if (type === "FACE_BLURRED") {
                return "FACE_BLURRED";
            } else if (type === "BACKGROUND_BLURRED") {
                return "BACKGROUND_BLURRED";
            } else if (type === "NO_BLUR") {
                return "NO_BLUR";
            }
            return null;
        }
        function vids(videos:  Video[]): (Video | undefined)[]{
            return (videos as Video[]).map((video) => {
                const typeLiteral = getTypeAsLiteral(video.type);
                if (typeLiteral !== null) {
                    return {
                        dateUploaded: new Date(video.dateUploaded),
                        name: video.name,
                        id: video.id,
                        type: typeLiteral,
                        uploaderId: video.uploaderId,
                        uploader: video.uploader
                    };
                }
            });
        }
          
        var videos 
        fetch("/api/video_list/list", {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            method: "GET"
        }).then(res =>{return res.json()})
        .then(data => {
            setVideosList(vids(data));
            setFilteredList(vids(data));
        })
        if (videos === undefined){
            return[]
        }
        return videos
    }

    function filterList(e: React.ChangeEvent<HTMLInputElement>) {
        const currentSearch = e.currentTarget.value.toLowerCase();
        setFilteredList(
            videosList.filter((val) => {
                if (currentSearch === "") {
                    return true;
                } else {
                    return val?.name.toLowerCase().includes(currentSearch);
                }
            })
        );
    }

    useEffect(() => {
        getVideos();
    }, []);

    return (
        <div>
            <NavBar />
            <div className={home.homepageContainer}>
                <div className={home.displayContainer}>
                    <Box sx={{}}>
                        <TextField
                            id="filled-basic"
                            variant="filled"
                            className={home.searchbar}
                            size="small"
                            placeholder="Search"
                            onChange={filterList}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="large" />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Box>

                    <VideoList filteredList={filteredList} />
                </div>
                <Fab variant="extended" className={home.uploadButton}>
                    Upload
                    <UploadFileIcon></UploadFileIcon>
                </Fab>
            </div>
        </div>
    );
}