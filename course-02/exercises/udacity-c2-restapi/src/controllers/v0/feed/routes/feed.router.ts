import { Router, Request, Response } from 'express';
import { FeedItem } from '../models/FeedItem';
import { requireAuth } from '../../users/routes/auth.router';
import * as AWS from '../../../../aws';

const router: Router = Router();

// Get all feed items
router.get('/', async (req: Request, res: Response) => {
    console.log(`----------> get /api/v0/feed/`);
    const items = await FeedItem.findAndCountAll({order: [['id', 'DESC']]});
    items.rows.map((item) => {
            if(item.url) {
                item.url = AWS.getGetSignedUrl(item.url);
            }
    });
    res.send(items);
});

//@TODO
//Add an endpoint to GET a specific resource by Primary Key
router.get( "/:id", async ( req: Request, res: Response ) => {
    console.log(`----------> get /api/v0/feed/:id`);
    // destruct our path params
    let { id } = req.params;

    // check to make sure the id is set, just in case above route get removed
    if (!id) { 
      // respond with an error if not
      return res.status(400).send(`Feed id is required`);
    }

    const feed = await FeedItem.findByPk(id);

    // respond not found, if we do not have this id
    if(!feed) {
      return res.status(404).send(`Feed with id:${id} was not found`);
    }

    //return the car with a sucess status code
    res.status(200).send(feed);
  } );

// update a specific resource
router.patch('/:id', 
    requireAuth, 
    async (req: Request, res: Response) => {
    console.log(`----------> patch /api/v0/feed/:id`);
    // destruct our path params
    let { id } = req.params;
    const body = req.body;

    // check request body exists
    if (body === {}) {
        return res.status(400).send({ message: 'Missing body of the PATCH request' });
    }

    // check to make sure the id is set
    if (!id) { 
        // respond with an error if not
        return res.status(400).send(`Feed id is required`);
    }

    // check request body exists
    if(body.constructor === Object && Object.keys(body).length === 0) {
        console.log('Body or the request is missing');
        return res.status(400).send({ message: 'Missing body of the PATCH request' });
    }

    const feed = await FeedItem.findByPk(id);

    // respond not found, if we do not have this id
    if(!feed) {
        return res.status(404).send(`Feed is not found`);
    }

    // update feed
    if(body.caption) {
        feed.caption = body.caption;
    }

    if(body.url) {
        feed.url = body.url;
    }

    const patched_feed = await feed.save();
    patched_feed.url = AWS.getGetSignedUrl(patched_feed.url);
    res.status(200).send(patched_feed);
});


// Get a signed url to put a new item in the bucket
router.get('/signed-url/:fileName', 
    requireAuth, 
    async (req: Request, res: Response) => {
    console.log(`----------> get /api/v0/feed/signed-url/:fileName`);
    let { fileName } = req.params;
    const url = AWS.getPutSignedUrl(fileName);
    res.status(201).send({url: url});
});

// Post meta data and the filename after a file is uploaded 
// NOTE the file name is they key name in the s3 bucket.
// body : {caption: string, fileName: string};
router.post('/', 
    requireAuth, 
    async (req: Request, res: Response) => {
    console.log(`----------> post /api/v0/feed/`);

    const caption = req.body.caption;
    const fileName = req.body.url;

    // check Caption is valid
    if (!caption) {
        return res.status(400).send({ message: 'Caption is required or malformed' });
    }
    // check Filename is valid
    if (!fileName) {
        return res.status(400).send({ message: 'File url is required' });
    }
    const item = await new FeedItem({
            caption: caption,
            url: fileName
    });
    const saved_item = await item.save();
    saved_item.url = AWS.getGetSignedUrl(saved_item.url);
    res.status(201).send(saved_item);
});

export const FeedRouter: Router = router;