import {Box, InputAdornment, TextField} from "@mui/material";
import React, {useEffect, useState} from "react";
import SearchIcon from "@mui/icons-material/Search";
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
import UploadDialogue from "components/upload-dialogue";
import {useNavigate} from "react-router-dom";
import NavBar from "../components/common";
import Button from "@mui/material/Button";
import Tags from "components/tags";

import * as home from "../static/home.css";

interface Column {
    id: "name" | "uploader" | "dateUploaded" | "options" | "tags";
    label: string;
    minWidth?: number;
    align?: "right";
}

interface VideoList {
    filteredList: Array<Video | undefined>;
}

interface VideoProps {
    filteredList: VideoList;
    disabled: boolean;
    updateVideos: () => void;
}

const columns: readonly Column[] = [
    {id: "name", label: "Video Title", minWidth: 170},
    {id: "uploader", label: "Uploaded By", minWidth: 170},
    {id: "dateUploaded", label: "Date Uploaded", minWidth: 170},
    {id: "tags", label: "Tags", minWidth: 170},
    {id: "options", label: "", minWidth: 100}
];

const VideoList = (props: VideoProps): JSX.Element => {
    //https://mui.com/material-ui/react-table/
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [tags, setTags] = useState<Array<Tag>>([]);

    const updateTags = () => {
        fetch("/api/video_list/tags", {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            method: "GET"
        })
            .then((res) => {
                return res.json();
            })
            .then((data) => {
                setTags(data);
            });
    };

    useEffect(() => {
        updateTags();
    }, []);

    const navigate = useNavigate();

    const routeChange = (key: string) => {
        if (!props.disabled) {
            const path = `/video/${key}`;
            navigate(path);
        }
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    // delete video from prisma and s3
    function handleDeleteVideo(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, fileId: number) {
        e.stopPropagation();
        fetch("/api/video_list/delete", {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                fileId: fileId
            })
        }).then((res) => {
            return res.json();
        });
        props.updateVideos();
    }

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
                        {props.filteredList.filteredList
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row) => {
                                if (row === undefined) {
                                    throw undefined;
                                }
                                return (
                                    <TableRow
                                        hover={!props.disabled}
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
                                            } else if (column.id === "name") {
                                                value = row[column.id];
                                            } else if (column.id === "options") {
                                                return (
                                                    <TableCell key={column.id}>
                                                        <Button
                                                            onClick={(e) =>
                                                                handleDeleteVideo(e, row.id)
                                                            }
                                                        >
                                                            Delete
                                                        </Button>
                                                    </TableCell>
                                                );
                                            } else if (column.id === "tags") {
                                                console.log(row);
                                                return (
                                                    <TableCell
                                                        key={column.id}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Tags
                                                            tagOptions={tags.map((tag) => tag.name)}
                                                            tags={row.tags.map((tag) => tag.name)}
                                                            videoID={row.id}
                                                            updateTagOptions={updateTags}
                                                        />
                                                    </TableCell>
                                                );
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
                count={props.filteredList.filteredList.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    );
};

export default function HomePage() {
    const [upload, showUploadDialogue] = useState(false);
    const [disabled, setDisabled] = useState(false);

    const sleep = (milliseconds: number) => {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    };

    const handleClick = async () => {
        showUploadDialogue(false);
        await sleep(500);
        setDisabled(false);
    };

    const handleUpload = () => {
        showUploadDialogue(true);
        setDisabled(true);
    };

    const [videosList, setVideosList] = useState<Array<Video | undefined>>([]);
    const [filteredList, setFilteredList] = useState<Array<Video | undefined>>([]);

    //Get videos from prisma
    function getVideos() {
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
        function vids(videos: Video[]): (Video | undefined)[] {
            return (videos as Video[]).map((video) => {
                const typeLiteral = getTypeAsLiteral(video.type);
                if (typeLiteral !== null) {
                    return {
                        dateUploaded: new Date(video.dateUploaded),
                        name: video.name,
                        id: video.id,
                        type: typeLiteral,
                        uploaderId: video.uploaderId,
                        uploader: video.uploader,
                        tags: video.tags
                    };
                }
            });
        }

        fetch("/api/video_list/list", {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            method: "GET"
        })
            .then((res) => {
                return res.json();
            })
            .then((data) => {
                setVideosList(vids(data));
                setFilteredList(vids(data));
            });
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
                            variant="standard"
                            className={home.searchbar}
                            size="small"
                            placeholder="Search"
                            sx={{input: {color: "white", margin: "7px"}}}
                            onChange={filterList}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment
                                        position="start"
                                        sx={{color: "white", margin: "5px"}}
                                    >
                                        <SearchIcon fontSize="large" />
                                    </InputAdornment>
                                ),
                                disableUnderline: true
                            }}
                        />
                    </Box>
                </div>
                <div className={home.uploadDialogue}>
                    {upload && (
                        <UploadDialogue handleClick={handleClick} updateVideos={getVideos} />
                    )}
                </div>
                <VideoList
                    disabled={disabled}
                    filteredList={{filteredList: filteredList}}
                    updateVideos={getVideos}
                />
            </div>
            <Fab variant="extended" className={home.uploadButton} onClick={handleUpload}>
                Upload
                <UploadFileIcon></UploadFileIcon>
            </Fab>
        </div>
    );
}
