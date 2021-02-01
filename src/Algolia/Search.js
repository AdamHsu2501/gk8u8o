import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles';
import { Paper, Popper, Grid } from '@material-ui/core';
import { SearchBox, InstantSearch, connectHits, Configure } from 'react-instantsearch-dom';

import * as ROUTES from '../routes'
import { searchClient } from './config'
import { useFirebase, _user, _stock } from '../Firebase'
import SearchCard from '../components/Card/SearchCard'

const useStyles = makeStyles(theme => ({
	root: {
		width: '100%'
	},

	popper: {
		zIndex: theme.zIndex.tooltip + 1,
		maxWidth: "80%",
	},
	paper: {
		wordWrap: 'break-word',
		backgroundColor: theme.palette.background.default
	}
}));


function Result({ indexName, setSearchState, searchState, hit, onClick }) {
	const { handleLabel } = useFirebase()
	var imgURL = null, title, body;
	switch (indexName) {
		case _user:
			imgURL = hit.photoURL;
			title = hit.email
			body = hit.id
			break;
		case _stock:
			imgURL = !!hit.images.length ? hit.images[0].preview : null
			title = handleLabel(hit.displayName)
			body = hit.code
			break;
		default:
			break;
	}

	const handleClick = () => {
		onClick(hit)

		setSearchState({
			...searchState,
			query: ""
		})
	}

	return <SearchCard avatar={imgURL} primary={title} secondary={body} onSubmit={handleClick} />
}

const ResultHits = connectHits(({ hits, hitComponent: ComponentToTender, anchorRef }) => {
	const classes = useStyles();
	return (
		<Popper open={true} anchorEl={anchorRef.current} placement="bottom" className={classes.popper}>
			<Paper className={classes.paper}>
				{hits.map(hit => (
					<ComponentToTender key={hit.objectID} hit={hit} />
				))}
			</Paper>
		</Popper>
	)
});

export default function Search({ indexName, configure, onClick, noDriection }) {
	const classes = useStyles();
	let history = useHistory()
	const [searchState, setSearchState] = useState({});
	const [open, setOpen] = useState(false)

	const Hit = useRef(props => (
		<Result
			{...props}
			indexName={indexName}
			searchState={searchState}
			setSearchState={setSearchState}
			onClick={onClick}
		/>
	));

	const handleSubmit = e => {
		e.preventDefault();

		history.push({
			pathname: ROUTES.LIST,
			search: `query=${searchState.query}`
		})
	}
	const anchorRef = useRef(null);

	useEffect(() => {
		var bool = !!searchState.query
		if (bool) {
			setTimeout(() => {
				setOpen(bool)
			}, 500)
		} else {
			setOpen(bool)
		}
	}, [searchState.query])

	var searchBoxSetting = noDriection ? {} : { onSubmit: handleSubmit }

	return (
		<InstantSearch
			searchClient={searchClient}
			indexName={indexName}
			searchState={searchState}
			onSearchStateChange={setSearchState}
			className={classes.root}

		>
			<Configure {...configure} />
			<SearchBox {...searchBoxSetting} />
			<Grid ref={anchorRef} ></Grid>
			{open && (
				<ResultHits hitComponent={Hit.current} anchorRef={anchorRef} />
			)}
		</InstantSearch>
	);
}