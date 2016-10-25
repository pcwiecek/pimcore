<?php
/**
 * Pimcore
 *
 * This source file is available under two different licenses:
 * - GNU General Public License version 3 (GPLv3)
 * - Pimcore Enterprise License (PEL)
 * Full copyright and license information is available in
 * LICENSE.md which is distributed with this source code.
 *
 * @category   Pimcore
 * @package    Notification
 * @copyright  Copyright (c) 2009-2016 pimcore GmbH (http://www.pimcore.org)
 * @license    http://www.pimcore.org/license     GPLv3 and PEL
 */

namespace Pimcore\Model\Notification\Listing;

use Pimcore\Model;
use Pimcore\Model\Document;
use Pimcore\Model\Notification;

/**
 * @author Piotr Ćwięcek <pcwiecek@divante.pl>
 * @author Kamil Karkus <kkarkus@divante.pl>
 *
 * @property \Pimcore\Model\Notification\Listing $model
 */
class Dao extends Model\Listing\Dao\AbstractDao
{

    /** @var  Callback function */
    protected $onCreateQueryCallback;

    /**
     * Loads a list of objects (all are an instance of Document) for the given parameters an return them
     *
     * @return array
     */
    public function load()
    {
        $notifications = [];
        $select = (string) $this->getQuery(['id']);

        $notificationsData = $this->db->fetchAll($select, $this->model->getConditionVariables());

        foreach ($notificationsData as $notificationData) {
            if ($notification = Notification::getById($notificationData["id"])) {
                $notifications[] = $notification;
            }
        }

        $this->model->setNotifications($notifications);

        return $notifications;
    }

    public function getQuery($columns)
    {
        $select = $this->db->select();
        $select->from(
            [ "notifications" ], $columns
        );
        $this->addConditions($select);
        $this->addOrder($select);
        $this->addLimit($select);
        $this->addGroupBy($select);

        if ($this->onCreateQueryCallback) {
            $closure = $this->onCreateQueryCallback;
            $closure($select);
        }

        return $select;
    }

    /**
     * Loads a list of document ids for the specicifies parameters, returns an array of ids
     *
     * @return array
     */
    public function loadIdList()
    {
        $select = (string) $this->getQuery(['id']);
        $documentIds = $this->db->fetchCol($select, $this->model->getConditionVariables());

        return $documentIds;
    }

    public function loadIdPathList()
    {
        $select = (string) $this->getQuery(['id', "CONCAT(path,`key`)"]);
        $documentIds = $this->db->fetchAll($select, $this->model->getConditionVariables());

        return $documentIds;
    }

    public function getCount()
    {
        $select = $this->getQuery([new \Zend_Db_Expr('COUNT(*)')]);
        $amount = (int)$this->db->fetchOne($select, $this->model->getConditionVariables());

        return $amount;
    }

    /**
     * @return int
     */
    public function getTotalCount()
    {
        try {
            $amount = (int) $this->db->fetchOne("SELECT COUNT(*) as amount FROM notifications " . $this->getCondition(), $this->model->getConditionVariables());
        } catch (\Exception $e) {
        }

        return $amount;
    }

    public function onCreateQuery(callable $callback)
    {
        $this->onCreateQueryCallback = $callback;
    }
}
